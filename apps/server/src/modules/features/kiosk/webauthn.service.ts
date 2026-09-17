import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { z } from 'zod';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { loadWebauthnConfig } from '@/configs/webauthn';
import { getRequestContext, runWithRequestContext } from '@/context/request-context';
import { AuditService } from '@/modules/audit/audit.service';
import { AttendanceService } from '@/modules/features/hr/attendance.service';
import { KIOSK_EMPLOYEE_GRANT_DURATION, KIOSK_WEBAUTHN_CHALLENGE_DURATION, KIOSK_AUTH_ATTEMPT_LIMIT, KIOSK_AUTH_WINDOW_SECONDS } from '@rona/config/kiosk';
import type { KioskPunchInput } from '@rona/types/kiosk';
import { rateLimit } from '@/redis';
import { CredentialRepository } from './credential.repository';
import type { KioskDeviceContext } from './kiosk.service';
import type { employeeCredentials } from '@/db/schemas/kiosk/webauthn';
import type { webauthnAuthenticationVerifySchema, webauthnRegistrationVerifySchema } from '@rona/validation/kiosk';

type AuthenticationVerifyPayload = z.infer<typeof webauthnAuthenticationVerifySchema>['response'];
type RegistrationVerifyPayload = z.infer<typeof webauthnRegistrationVerifySchema>['response'];

@Injectable()
export class WebAuthnService {
  private readonly config = loadWebauthnConfig();

  constructor(
    private readonly credentials: CredentialRepository,
    private readonly attendance: AttendanceService,
    private readonly audit: AuditService,
  ) {}

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private userHandle(employeeId: string) {
    return Buffer.from(employeeId).toString('base64url');
  }

  private actor() {
    const context = getRequestContext();
    if (!context?.organizationId || !context.userId) throw new UnauthorizedException();
    return { organizationId: context.organizationId, actorId: context.userId };
  }

  private metadata(row: typeof employeeCredentials.$inferSelect) {
    return { id: row.id, deviceName: row.deviceName, createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt, revokedAt: row.revokedAt, deviceType: row.deviceType };
  }

  private async limited(key: string) {
    if (!(await rateLimit(`kiosk:webauthn:${key}`, KIOSK_AUTH_ATTEMPT_LIMIT, KIOSK_AUTH_WINDOW_SECONDS))) {
      throw new UnauthorizedException('WebAuthn authorization failed');
    }
  }

  private async attempt<T>(organizationId: string, entityId: string, callback: () => Promise<T>) {
    try {
      return await callback();
    } catch {
      await this.audit.record({ organizationId, entityId, entityType: 'kiosk_webauthn',
        action: 'kiosk.webauthn.failed', after: { reason: 'authorization_failed' } });
      throw new UnauthorizedException('WebAuthn authorization failed');
    }
  }

  async list(employeeId: string) {
    const { organizationId } = this.actor();
    return this.credentials.transaction(async (tx) => {
      await this.credentials.activeOrganization(organizationId, tx);
      await this.credentials.employee(organizationId, employeeId, tx, false);
      return (await this.credentials.list(organizationId, employeeId, tx)).map((row) => this.metadata(row));
    });
  }

  async registrationOptions(employeeId: string, deviceName: string) {
    const actor = this.actor();
    return this.attempt(actor.organizationId, employeeId, async () => {
      await this.limited(`enroll:${actor.actorId}`);
      return this.credentials.transaction(async (tx) => {
        await this.credentials.activeOrganization(actor.organizationId, tx);
        const employee = await this.credentials.employee(actor.organizationId, employeeId, tx);
        const existing = await this.credentials.list(actor.organizationId, employeeId, tx);
        const options = await generateRegistrationOptions({
          rpID: this.config.WEBAUTHN_RP_ID, rpName: this.config.WEBAUTHN_RP_NAME,
          userID: new Uint8Array(Buffer.from(employeeId)), userName: employee.eid, userDisplayName: employee.fullName,
          attestationType: 'none', timeout: KIOSK_WEBAUTHN_CHALLENGE_DURATION,
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
          preferredAuthenticatorType: 'remoteDevice',
          excludeCredentials: existing.map((row) => ({ id: row.credentialId, transports: row.transports })),
        });
        const challengeId = await this.credentials.createChallenge({ ...actor, employeeId, deviceName,
          purpose: 'registration', challenge: options.challenge, expiresAt: new Date(Date.now() + KIOSK_WEBAUTHN_CHALLENGE_DURATION) }, tx);
        return { challengeId, options };
      });
    });
  }

  async registrationVerify(employeeId: string, challengeId: string, response: RegistrationVerifyPayload) {
    const actor = this.actor();
    return this.attempt(actor.organizationId, employeeId, async () => {
      await this.limited(`enroll:${actor.actorId}`);
      const challenge = await this.credentials.consumeChallenge(challengeId, { ...actor, employeeId, purpose: 'registration' });
      if (response.id !== response.rawId) throw new UnauthorizedException();
      const verifierInput = {
        ...response,
        authenticatorAttachment: response.authenticatorAttachment ?? undefined,
      };
      const result = await verifyRegistrationResponse({ response: verifierInput, expectedChallenge: challenge.challenge,
        expectedOrigin: this.config.WEBAUTHN_ORIGIN, expectedRPID: this.config.WEBAUTHN_RP_ID,
        requireUserVerification: true, requireUserPresence: true });
      if (!result.verified || !result.registrationInfo.userVerified) throw new UnauthorizedException();
      const info = result.registrationInfo;
      if (info.credential.id !== response.id) throw new UnauthorizedException();
      return this.credentials.transaction(async (tx) => {
        await this.credentials.activeOrganization(actor.organizationId, tx);
        await this.credentials.employee(actor.organizationId, employeeId, tx);
        const row = await this.credentials.create({ organizationId: actor.organizationId, employeeId,
          credentialId: info.credential.id, publicKey: Buffer.from(info.credential.publicKey).toString('base64url'),
          counter: info.credential.counter, userHandle: this.userHandle(employeeId),
          transports: info.credential.transports ?? [], deviceName: challenge.deviceName!,
          deviceType: info.credentialDeviceType, backedUp: info.credentialBackedUp }, tx);
        await this.audit.record({ ...actor, action: 'kiosk.webauthn.enroll', entityType: 'employee', entityId: employeeId,
          after: { id: row.id, deviceType: row.deviceType } }, tx);
        return this.metadata(row);
      });
    });
  }

  async revoke(employeeId: string, id: string) {
    const actor = this.actor();
    return this.credentials.transaction(async (tx) => {
      await this.credentials.activeOrganization(actor.organizationId, tx);
      await this.credentials.employee(actor.organizationId, employeeId, tx, false);
      const row = await this.credentials.revoke(actor.organizationId, employeeId, id, tx);
      await this.audit.record({ ...actor, action: 'kiosk.webauthn.revoke', entityType: 'employee', entityId: employeeId,
        after: { id: row.id } }, tx);
      return this.metadata(row);
    });
  }

  async authenticationOptions(context: KioskDeviceContext, eid?: string) {
    return this.attempt(context.organizationId, context.kioskId, async () => {
      await this.limited(context.kioskId);
      return this.credentials.transaction(async (tx) => {
        await this.credentials.activeDevice(context, tx);
        const employee = eid ? await this.credentials.employeeByEid(context.organizationId, eid, tx) : undefined;
        const existing = employee ? (await this.credentials.list(context.organizationId, employee.id, tx)).filter((row) => !row.revokedAt) : undefined;
        if (existing && !existing.length) throw new UnauthorizedException();
        const options = await generateAuthenticationOptions({ rpID: this.config.WEBAUTHN_RP_ID,
          userVerification: 'required', timeout: KIOSK_WEBAUTHN_CHALLENGE_DURATION,
          allowCredentials: existing?.map((row) => ({ id: row.credentialId, transports: row.transports })) });
        options.hints = ['hybrid'];
        const challengeId = await this.credentials.createChallenge({ organizationId: context.organizationId,
          kioskId: context.kioskId, sessionHash: context.sessionHash, employeeId: employee?.id,
          purpose: 'authentication', challenge: options.challenge, expiresAt: new Date(Date.now() + KIOSK_WEBAUTHN_CHALLENGE_DURATION) }, tx);
        return { challengeId, options };
      });
    });
  }

  async authenticationVerify(context: KioskDeviceContext, challengeId: string, response: AuthenticationVerifyPayload) {
    return this.attempt(context.organizationId, context.kioskId, async () => {
      await this.limited(context.kioskId);
      const challenge = await this.credentials.consumeChallenge(challengeId, { organizationId: context.organizationId,
        purpose: 'authentication', kioskId: context.kioskId, sessionHash: context.sessionHash });
      if (response.id !== response.rawId) throw new UnauthorizedException();
      const userHandle = response.response.userHandle ?? undefined;
      const verifierInput = {
        ...response,
        authenticatorAttachment: response.authenticatorAttachment ?? undefined,
        response: { ...response.response, userHandle },
      };
      const candidate = await this.credentials.find(context.organizationId, response.id);
      if (!candidate || (challenge.employeeId && candidate.employeeId !== challenge.employeeId) ||
        (!challenge.employeeId && !userHandle) ||
        (userHandle && userHandle !== candidate.userHandle)) throw new UnauthorizedException();
      return this.credentials.transaction(async (tx) => {
        await this.credentials.activeDevice(context, tx);
        const employee = await this.credentials.employee(context.organizationId, candidate.employeeId, tx);
        const row = await this.credentials.lockCredential(context.organizationId, employee.id, candidate.id, tx);
        const result = await verifyAuthenticationResponse({ response: verifierInput, expectedChallenge: challenge.challenge,
          expectedOrigin: this.config.WEBAUTHN_ORIGIN, expectedRPID: this.config.WEBAUTHN_RP_ID, requireUserVerification: true,
          credential: { id: row.credentialId, publicKey: new Uint8Array(Buffer.from(row.publicKey, 'base64url')),
            counter: row.counter, transports: row.transports } });
        if (!result.verified || !result.authenticationInfo.userVerified || result.authenticationInfo.credentialID !== row.credentialId) throw new UnauthorizedException();
        await this.credentials.advanceCounter(row, result.authenticationInfo.newCounter, result.authenticationInfo.credentialBackedUp,
          result.authenticationInfo.credentialDeviceType, tx);
        const grantToken = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + KIOSK_EMPLOYEE_GRANT_DURATION);
        await this.credentials.createGrant({ tokenHash: this.hash(grantToken), organizationId: context.organizationId,
          kioskId: context.kioskId, sessionHash: context.sessionHash, employeeId: employee.id, credentialId: row.id, expiresAt }, tx);
        await this.audit.record({ organizationId: context.organizationId, action: 'kiosk.webauthn.authenticate',
          entityType: 'kiosk', entityId: context.kioskId, after: { employeeId: employee.id } }, tx);
        return { employeeName: employee.fullName, expiresAt: expiresAt.toISOString(), grantToken };
      });
    });
  }

  async punch(context: KioskDeviceContext, input: KioskPunchInput, token: unknown) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new UnauthorizedException('Employee authentication required');
    const grant = await this.credentials.consumeGrant(this.hash(token), context);
    return runWithRequestContext({ requestId: getRequestContext()?.requestId ?? 'kiosk', organizationId: context.organizationId,
      roles: [], permissions: [] }, () => this.credentials.transaction(async (tx) => {
      await this.credentials.activeDevice(context, tx);
      const employee = await this.credentials.employee(context.organizationId, grant.employeeId, tx);
      await this.credentials.lockCredential(context.organizationId, employee.id, grant.credentialId, tx);
      const event = await this.attendance.punchKiosk(employee.id, input.eventType, tx);
      return { employeeName: employee.fullName, eventType: event.eventType, eventAt: event.eventAt.toISOString() };
    }));
  }
}
