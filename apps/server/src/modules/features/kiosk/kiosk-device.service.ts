import { createHash, randomInt } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizations } from '@/db/schemas/admin';
import { users } from '@/db/schemas/auth';
import { kiosks } from '@/db/schemas/kiosk';
import { patchRequestContext } from '@/context/request-context';
import { AuditService } from '@/modules/audit/audit.service';
import { rateLimit } from '@/redis';
import {
  KIOSK_ADMIN_PIN_ATTEMPT_LIMIT,
  KIOSK_ADMIN_PIN_WINDOW_SECONDS,
  KIOSK_AUTH_ATTEMPT_LIMIT,
  KIOSK_AUTH_WINDOW_SECONDS,
  KIOSK_ENROLL_CODE_LENGTH,
  KIOSK_ENROLL_CODE_TTL_SECONDS,
  KIOSK_ENROLL_SESSION_SECONDS,
  KIOSK_OFFLINE_MAX_AGE_HOURS,
  KIOSK_PUNCH_ATTEMPT_LIMIT,
  KIOSK_PUNCH_WINDOW_SECONDS,
} from '@rona/config/kiosk';
import type {
  KioskAdminPinVerifyResult,
  KioskDevicePunchBatchItem,
  KioskDevicePunchBatchResult,
  KioskDevicePunchInput,
  KioskDevicePunchResult,
  KioskDeviceRegisterInput,
  KioskDeviceSession,
  KioskEmployeeStatus,
  KioskEnrollAuthorizeResult,
  KioskEnrollCodeResult,
  KioskHeartbeatInput,
  KioskHeartbeatResult,
  KioskRosterResult,
} from '@rona/types/kiosk';
import {
  AttendanceService,
  allowedNextAttendanceEvents,
} from '@/modules/features/hr/attendance.service';
import { EmployeesRepository } from '@/modules/features/hr/employees.repository';
import {
  KioskAdminPinInvalidException,
  KioskAuthenticationException,
  KioskEmployeeInactiveException,
  KioskEmployeeNotFoundException,
  KioskEnrollCodeInvalidException,
  KioskEnrollCodeUnavailableException,
  KioskEnrollUnauthorizedException,
  KioskEventTooOldException,
  KioskPolicyNotSatisfiedException,
  KioskPublicKeyInvalidException,
} from './kiosk.exception';
import {
  evaluateAttestationChain,
  isValidEcPublicKey,
  satisfiesVerificationPolicy,
} from './kiosk-device.crypto';
import { KioskDeviceStore } from './kiosk-device.store';
import type { KioskEnrollActor } from './kiosk-credentials.service';
import { KioskService, type KioskDeviceContext } from './kiosk.service';
import { KiosksRepository } from './kiosks.repository';

const ENROLL_TOKEN_PURPOSE = 'kiosk-enroll';

interface KioskEnrollClaims {
  purpose: string;
  kioskId: string;
  organizationId: string;
  userId: string;
}

type KioskRow = typeof kiosks.$inferSelect;

/** Postgres unique violation on the attendance idempotency key. */
function isClientEventConflict(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 3; depth += 1) {
    const candidate = current as {
      code?: string;
      constraint?: string;
      cause?: unknown;
    };
    if (
      candidate.code === '23505' &&
      (!candidate.constraint ||
        candidate.constraint ===
          'attendance_events_organization_client_event_unique')
    ) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}

// Native kiosk terminals (Rona Kiosk app). Device-scoped methods run after
// KioskDeviceGuard, which sets the kiosk's organization as the tenant.
@Injectable()
export class KioskDeviceService {
  private readonly logger = new Logger(KioskDeviceService.name);

  constructor(
    private readonly kioskService: KioskService,
    private readonly kiosksRepository: KiosksRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly attendanceService: AttendanceService,
    private readonly deviceStore: KioskDeviceStore,
    private readonly auditService: AuditService,
  ) {}

  async register(input: KioskDeviceRegisterInput): Promise<KioskDeviceSession> {
    const tokenHash = createHash('sha256')
      .update(input.deviceToken)
      .digest('hex');

    const allowed = await rateLimit(
      `kiosk:auth:attempts:${tokenHash.slice(0, 16)}`,
      KIOSK_AUTH_ATTEMPT_LIMIT,
      KIOSK_AUTH_WINDOW_SECONDS,
    );
    if (!allowed) throw new KioskAuthenticationException();

    const kiosk = await this.kiosksRepository.findByTokenHash(tokenHash);
    if (!kiosk || kiosk.status !== 'ACTIVE') {
      if (kiosk) {
        await this.audit(
          kiosk.organizationId,
          kiosk.id,
          'kiosk.device.pair_failed',
          {
            reason: 'inactive_device',
          },
        );
      }
      throw new KioskAuthenticationException();
    }

    if (!isValidEcPublicKey(input.publicKey)) {
      throw new KioskPublicKeyInvalidException();
    }

    const attestationChain = input.attestationChain ?? [];
    const attestationStatus = evaluateAttestationChain(
      attestationChain,
      input.publicKey,
    );
    const repaired =
      kiosk.publicKey != null && kiosk.publicKey !== input.publicKey;

    const updated = await this.withTenant(kiosk.organizationId, async () => {
      const row = await this.kiosksRepository.update(kiosk.id, {
        publicKey: input.publicKey,
        pairedAt: new Date(),
        attestationStatus,
        attestationChain,
        deviceInfo: input.device,
        appVersion: input.device.appVersion,
        lastSeenAt: new Date(),
      });
      await this.audit(
        kiosk.organizationId,
        kiosk.id,
        repaired ? 'kiosk.device.repair' : 'kiosk.device.pair',
        {
          attestationStatus,
          model: input.device.model,
          manufacturer: input.device.manufacturer,
          engine: input.device.engine,
          appVersion: input.device.appVersion,
        },
      );
      return row;
    });

    return this.buildSession(updated);
  }

  /** Called after KioskDeviceSignatureGuard verified the device key. */
  async refreshSession(kioskId: string): Promise<KioskDeviceSession> {
    const kiosk = await this.kiosksRepository.findDeviceById(kioskId);
    if (!kiosk || kiosk.status !== 'ACTIVE' || !kiosk.publicKey) {
      throw new KioskAuthenticationException();
    }
    return this.buildSession(kiosk);
  }

  async roster(since?: Date): Promise<KioskRosterResult> {
    const serverTime = new Date();
    const rows = await this.employeesRepository.listForKioskRoster(since);
    return {
      serverTime: serverTime.toISOString(),
      employees: rows.map((row) => ({
        employeeId: row.id,
        eid: row.eid,
        fullName: row.fullName,
        active: row.status === 'active' && !row.archivedAt,
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  async employeeStatus(employeeId: string): Promise<KioskEmployeeStatus> {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new KioskEmployeeNotFoundException();

    const status = await this.attendanceService.getCurrentState(employeeId);
    return {
      employeeId,
      employeeName: employee.fullName,
      currentState: status.currentState,
      allowedNextEvents: allowedNextAttendanceEvents(status.currentState),
      lastEventAt: status.lastEvent?.eventAt.toISOString() ?? null,
    };
  }

  async punch(
    device: KioskDeviceContext,
    input: KioskDevicePunchInput,
  ): Promise<KioskDevicePunchResult> {
    await this.requirePunchRate(device);
    return this.recordPunch(device, input, new Date());
  }

  async punchBatch(
    device: KioskDeviceContext,
    events: KioskDevicePunchInput[],
  ): Promise<KioskDevicePunchBatchResult> {
    await this.requirePunchRate(device);

    const ordered = [...events].sort(
      (a, b) => a.deviceEventAt.getTime() - b.deviceEventAt.getTime(),
    );
    const results: KioskDevicePunchBatchItem[] = [];
    for (const event of ordered) {
      try {
        const now = new Date();
        const oldest = now.getTime() - KIOSK_OFFLINE_MAX_AGE_HOURS * 3600_000;
        if (event.deviceEventAt.getTime() < oldest) {
          throw new KioskEventTooOldException();
        }
        const eventAt =
          event.deviceEventAt.getTime() > now.getTime()
            ? now
            : event.deviceEventAt;
        const result = await this.recordPunch(device, event, eventAt);
        results.push({
          clientEventId: event.clientEventId,
          status: result.duplicate ? 'DUPLICATE' : 'RECORDED',
          result,
        });
      } catch (error) {
        if (!(error instanceof HttpException)) throw error;
        results.push({
          clientEventId: event.clientEventId,
          status: 'REJECTED',
          error: {
            statusCode: error.getStatus(),
            message: this.errorMessage(error),
          },
        });
      }
    }
    return { results };
  }

  async createEnrollCode(
    organizationId: string,
    userId: string,
  ): Promise<KioskEnrollCodeResult> {
    const [user] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const max = 10 ** KIOSK_ENROLL_CODE_LENGTH;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = String(randomInt(0, max)).padStart(
        KIOSK_ENROLL_CODE_LENGTH,
        '0',
      );
      const issued = await this.deviceStore.issueEnrollCode(code, {
        organizationId,
        userId,
        supervisorName: user?.fullName ?? '',
      });
      if (issued) {
        await this.audit(
          organizationId,
          undefined,
          'kiosk.enroll_code.create',
          {
            userId,
          },
        );
        return {
          code,
          expiresAt: new Date(
            Date.now() + KIOSK_ENROLL_CODE_TTL_SECONDS * 1000,
          ).toISOString(),
        };
      }
    }
    throw new KioskEnrollCodeUnavailableException();
  }

  async authorizeEnrollment(
    device: KioskDeviceContext,
    code: string,
  ): Promise<KioskEnrollAuthorizeResult> {
    const allowed = await rateLimit(
      `kiosk:enroll:attempts:${device.kioskId}`,
      KIOSK_ADMIN_PIN_ATTEMPT_LIMIT,
      KIOSK_ADMIN_PIN_WINDOW_SECONDS,
    );
    if (!allowed) {
      throw new HttpException(
        'Too many attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const grant = await this.deviceStore.consumeEnrollCode(
      device.organizationId,
      code,
    );
    if (!grant || grant.organizationId !== device.organizationId) {
      await this.audit(
        device.organizationId,
        device.kioskId,
        'kiosk.enroll.authorize_failed',
        {},
      );
      throw new KioskEnrollCodeInvalidException();
    }

    const expires = new Date(Date.now() + KIOSK_ENROLL_SESSION_SECONDS * 1000);
    const claims: KioskEnrollClaims = {
      purpose: ENROLL_TOKEN_PURPOSE,
      kioskId: device.kioskId,
      organizationId: device.organizationId,
      userId: grant.userId,
    };
    const enrollToken = jwt.sign(claims, process.env.JWT_SECRET!, {
      expiresIn: KIOSK_ENROLL_SESSION_SECONDS,
    });

    await this.audit(
      device.organizationId,
      device.kioskId,
      'kiosk.enroll.authorize',
      {
        userId: grant.userId,
      },
    );

    return {
      enrollToken,
      expiresAt: expires.toISOString(),
      supervisorName: grant.supervisorName,
    };
  }

  /** Resolves the supervisor behind an enroll token issued to this kiosk. */
  verifyEnrollToken(
    device: KioskDeviceContext,
    token: string | undefined,
  ): KioskEnrollActor {
    if (!token) throw new KioskEnrollUnauthorizedException();
    let claims: KioskEnrollClaims;
    try {
      claims = jwt.verify(token, process.env.JWT_SECRET!) as KioskEnrollClaims;
    } catch {
      throw new KioskEnrollUnauthorizedException();
    }
    if (
      claims.purpose !== ENROLL_TOKEN_PURPOSE ||
      claims.kioskId !== device.kioskId ||
      claims.organizationId !== device.organizationId ||
      !claims.userId
    ) {
      throw new KioskEnrollUnauthorizedException();
    }
    return { kioskId: device.kioskId, userId: claims.userId };
  }

  async heartbeat(
    device: KioskDeviceContext,
    input: KioskHeartbeatInput,
  ): Promise<KioskHeartbeatResult> {
    const now = new Date();
    const row = await this.kiosksRepository.update(device.kioskId, {
      lastHeartbeat: input,
      lastHeartbeatAt: now,
      appVersion: input.appVersion,
    });
    return {
      serverTime: now.toISOString(),
      verificationPolicy: row.verificationPolicy,
      hasAdminPin: row.adminPinHash != null,
    };
  }

  async verifyAdminPin(
    device: KioskDeviceContext,
    pin: string,
  ): Promise<KioskAdminPinVerifyResult> {
    const allowed = await rateLimit(
      `kiosk:admin-pin:attempts:${device.kioskId}`,
      KIOSK_ADMIN_PIN_ATTEMPT_LIMIT,
      KIOSK_ADMIN_PIN_WINDOW_SECONDS,
    );
    if (!allowed) {
      throw new HttpException(
        'Too many attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const kiosk = await this.kiosksRepository.findDeviceById(device.kioskId);
    const valid =
      kiosk?.adminPinHash != null &&
      (await bcrypt.compare(pin, kiosk.adminPinHash));
    if (!valid) {
      await this.audit(
        device.organizationId,
        device.kioskId,
        'kiosk.admin_pin.failed',
        {},
      );
      throw new KioskAdminPinInvalidException();
    }
    return { valid: true };
  }

  private async recordPunch(
    device: KioskDeviceContext,
    input: KioskDevicePunchInput,
    eventAt: Date,
  ): Promise<KioskDevicePunchResult> {
    const existing = await this.attendanceService.findByClientEventId(
      input.clientEventId,
    );
    if (existing) return this.duplicateResult(existing);

    const employee = await this.employeesRepository.findById(input.employeeId);
    if (!employee) {
      await this.audit(
        device.organizationId,
        device.kioskId,
        'kiosk.attendance.unknown_employee',
        {
          employeeId: input.employeeId,
        },
      );
      throw new KioskEmployeeNotFoundException();
    }
    if (employee.status !== 'active' || employee.archivedAt) {
      await this.audit(
        device.organizationId,
        device.kioskId,
        'kiosk.attendance.employee_inactive',
        {
          employeeId: employee.id,
        },
      );
      throw new KioskEmployeeInactiveException();
    }

    const kiosk = await this.kiosksRepository.findDeviceById(device.kioskId);
    if (
      !kiosk ||
      !satisfiesVerificationPolicy(kiosk.verificationPolicy, input.methods)
    ) {
      await this.audit(
        device.organizationId,
        device.kioskId,
        'kiosk.attendance.policy_rejected',
        {
          employeeId: employee.id,
          methods: input.methods,
          policy: kiosk?.verificationPolicy,
        },
      );
      throw new KioskPolicyNotSatisfiedException();
    }

    try {
      const event = await this.attendanceService.punchDevice({
        employeeId: employee.id,
        eventType: input.eventType,
        eventAt,
        kioskId: device.kioskId,
        methods: input.methods,
        matchScore: input.matchScore ?? null,
        clientEventId: input.clientEventId,
        deviceEventAt: input.deviceEventAt,
      });
      return {
        eventId: event.id,
        clientEventId: input.clientEventId,
        employeeId: employee.id,
        employeeName: employee.fullName,
        eventType: event.eventType,
        eventAt: event.eventAt.toISOString(),
        duplicate: false,
      };
    } catch (error) {
      if (!isClientEventConflict(error)) throw error;
      const raced = await this.attendanceService.findByClientEventId(
        input.clientEventId,
      );
      if (!raced) throw error;
      return this.duplicateResult(raced);
    }
  }

  private async duplicateResult(event: {
    id: string;
    clientEventId: string | null;
    employeeId: string;
    eventType: KioskDevicePunchResult['eventType'];
    eventAt: Date;
  }): Promise<KioskDevicePunchResult> {
    const employee = await this.employeesRepository.findById(event.employeeId);
    return {
      eventId: event.id,
      clientEventId: event.clientEventId ?? '',
      employeeId: event.employeeId,
      employeeName: employee?.fullName ?? '',
      eventType: event.eventType,
      eventAt: event.eventAt.toISOString(),
      duplicate: true,
    };
  }

  private async requirePunchRate(device: KioskDeviceContext) {
    const allowed = await rateLimit(
      `kiosk:punch:attempts:${device.kioskId}`,
      KIOSK_PUNCH_ATTEMPT_LIMIT,
      KIOSK_PUNCH_WINDOW_SECONDS,
    );
    if (!allowed) {
      throw new HttpException(
        'Too many attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async buildSession(kiosk: KioskRow): Promise<KioskDeviceSession> {
    const [organization] = await db
      .select({ name: organizations.name, logoUrl: organizations.logoUrl })
      .from(organizations)
      .where(eq(organizations.id, kiosk.organizationId))
      .limit(1);

    const session = this.kioskService.issueSessionToken(kiosk);
    return {
      ...session,
      kiosk: {
        id: kiosk.id,
        deviceId: kiosk.deviceId,
        name: kiosk.name,
        verificationPolicy: kiosk.verificationPolicy,
        hasAdminPin: kiosk.adminPinHash != null,
      },
      organization: {
        id: kiosk.organizationId,
        name: organization?.name ?? '',
        logoUrl: organization?.logoUrl ?? null,
      },
    };
  }

  private errorMessage(error: HttpException): string {
    const response = error.getResponse();
    if (typeof response === 'object' && response && 'message' in response) {
      const message = response.message;
      return Array.isArray(message) ? message.join(', ') : String(message);
    }
    return error.message;
  }

  private async withTenant<T>(
    organizationId: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    patchRequestContext({ organizationId });
    try {
      return await callback();
    } finally {
      patchRequestContext({ organizationId: undefined });
    }
  }

  private async audit(
    organizationId: string,
    kioskId: string | undefined,
    action: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.auditService.record({
        organizationId,
        entityId: kioskId,
        action,
        entityType: 'kiosk',
        after: details,
      });
    } catch (error) {
      this.logger.warn(`kiosk device audit failed: ${String(error)}`);
    }
  }
}
