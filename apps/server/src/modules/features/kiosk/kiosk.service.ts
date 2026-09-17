import { createHash, randomBytes } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { WebAuthnService } from './webauthn.service';
import * as jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db, pooledDb } from '@/db';
import { organizations } from '@/db/schemas/admin';
import { kiosks } from '@/db/schemas/kiosk';
import {
  getRequestContext,
} from '@/context/request-context';
import { AuditService } from '@/modules/audit/audit.service';
import { rateLimit } from '@/redis';
import {
  KIOSK_AUTH_ATTEMPT_LIMIT,
  KIOSK_AUTH_WINDOW_SECONDS,
  KIOSK_DEFAULT_PAGE,
  KIOSK_DEFAULT_PAGE_SIZE,
  KIOSK_PUNCH_ATTEMPT_LIMIT,
  KIOSK_PUNCH_WINDOW_SECONDS,
  KIOSK_SESSION_DURATION,
} from '@rona/config/kiosk';
import type {
  Kiosk,
  KioskCreateInput,
  KioskListParams,
  KioskListSearchParams,
  KioskPunchInput,
  KioskPunchResult,
  KioskRegistrationResult,
  KioskSession,
  KioskUpdateInput,
  KioskUpdateResult,
} from '@rona/types/kiosk';
import {
  KioskAlreadyActiveException,
  KioskAlreadyInactiveException,
  KioskAuthenticationException,
  KioskNotFoundException,
  KioskTokenConflictException,
} from './kiosk.exception';
import { KiosksRepository } from './kiosks.repository';

export interface KioskDeviceContext {
  kioskId: string;
  deviceId: string;
  organizationId: string;
  sessionHash: string;
  tokenVersion: string;
}

interface KioskSessionClaims {
  kioskId: string;
  deviceId: string;
  organizationId: string;
  tokenVersion: string;
  jti: string;
}

@Injectable()
export class KioskService {
  private readonly logger = new Logger(KioskService.name);

  constructor(
    private readonly kiosksRepository: KiosksRepository,
    private readonly webauthnService: WebAuthnService,
    private readonly auditService: AuditService,
  ) {}

  async registerKiosk(
    input: KioskCreateInput,
  ): Promise<KioskRegistrationResult> {
    const deviceToken = input.deviceToken ?? randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(deviceToken);

    if (await this.kiosksRepository.findByTokenHash(tokenHash)) {
      throw new KioskTokenConflictException();
    }

    const deviceId = `KSK-${randomBytes(6).toString('hex').toUpperCase()}`;

    const created = await pooledDb.transaction(async (tx) => {
      const kiosk = await this.kiosksRepository.create(
        {
          organizationId: this.currentOrganizationId(),
          deviceId,
          name: input.name,
          tokenHash,
        },
        tx,
      );
      await this.auditService.record(
        {
          organizationId: kiosk.organizationId,
          action: 'kiosk.register',
          entityType: 'kiosk',
          entityId: kiosk.id,
          after: { deviceId: kiosk.deviceId, name: kiosk.name },
        },
        tx,
      );
      return kiosk;
    });

    return { kiosk: this.toDto(created), deviceToken };
  }

  async listKiosks(params: KioskListSearchParams) {
    const resolved: KioskListParams = {
      ...params,
      page: params.page ?? KIOSK_DEFAULT_PAGE,
      limit: params.limit ?? KIOSK_DEFAULT_PAGE_SIZE,
    };
    const { rows, total } = await this.kiosksRepository.list(resolved);
    return {
      data: rows.map((row) => this.toDto(row)),
      pagination: {
        page: resolved.page,
        limit: resolved.limit,
        totalItems: total,
        totalPages: Math.ceil(total / resolved.limit),
      },
    };
  }

  async getKiosk(kioskId: string): Promise<Kiosk> {
    const kiosk = await this.kiosksRepository.findById(kioskId);
    if (!kiosk) throw new KioskNotFoundException();
    return this.toDto(kiosk);
  }

  async updateKiosk(
    kioskId: string,
    input: KioskUpdateInput,
  ): Promise<KioskUpdateResult> {
    const existing = await this.kiosksRepository.findById(kioskId);
    if (!existing) throw new KioskNotFoundException();

    let deviceToken: string | undefined;
    let tokenHash: string | undefined;
    if (input.deviceToken) {
      deviceToken = input.deviceToken;
      tokenHash = this.hashToken(deviceToken);
      const collision = await this.kiosksRepository.findByTokenHash(tokenHash);
      if (collision && collision.id !== kioskId) {
        throw new KioskTokenConflictException();
      }
    }

    const updated = await pooledDb.transaction(async (tx) => {
      const row = await this.kiosksRepository.update(
        kioskId,
        {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(tokenHash !== undefined ? { tokenHash } : {}),
        },
        tx,
      );
      await this.auditService.record(
        {
          organizationId: row.organizationId,
          action: 'kiosk.update',
          entityType: 'kiosk',
          entityId: kioskId,
          before: { name: existing.name },
          after: {
            name: row.name,
            ...(tokenHash !== undefined ? { credentialRotated: true } : {}),
          },
        },
        tx,
      );
      return row;
    });

    return {
      kiosk: this.toDto(updated),
      ...(deviceToken ? { deviceToken } : {}),
    };
  }

  async activateKiosk(kioskId: string): Promise<Kiosk> {
    const existing = await this.kiosksRepository.findById(kioskId);
    if (!existing) throw new KioskNotFoundException();
    if (existing.status === 'ACTIVE') throw new KioskAlreadyActiveException();

    const updated = await pooledDb.transaction(async (tx) => {
      const row = await this.kiosksRepository.update(
        kioskId,
        { status: 'ACTIVE' },
        tx,
      );
      await this.auditService.record(
        {
          organizationId: row.organizationId,
          action: 'kiosk.activate',
          entityType: 'kiosk',
          entityId: kioskId,
          before: { status: existing.status },
          after: { status: 'ACTIVE' },
        },
        tx,
      );
      return row;
    });

    return this.toDto(updated);
  }

  async deactivateKiosk(kioskId: string): Promise<Kiosk> {
    const existing = await this.kiosksRepository.findById(kioskId);
    if (!existing) throw new KioskNotFoundException();
    if (existing.status === 'INACTIVE')
      throw new KioskAlreadyInactiveException();

    const updated = await pooledDb.transaction(async (tx) => {
      const row = await this.kiosksRepository.update(
        kioskId,
        { status: 'INACTIVE' },
        tx,
      );
      await this.auditService.record(
        {
          organizationId: row.organizationId,
          action: 'kiosk.deactivate',
          entityType: 'kiosk',
          entityId: kioskId,
          before: { status: existing.status },
          after: { status: 'INACTIVE' },
        },
        tx,
      );
      return row;
    });

    return this.toDto(updated);
  }

  async authenticateDevice(
    deviceToken: string,
  ): Promise<KioskSession & { sessionToken: string }> {
    const tokenHash = this.hashToken(deviceToken);

    const allowed = await rateLimit(
      `kiosk:auth:attempts:${tokenHash.slice(0, 16)}`,
      KIOSK_AUTH_ATTEMPT_LIMIT,
      KIOSK_AUTH_WINDOW_SECONDS,
    );
    if (!allowed) throw new KioskAuthenticationException();

    const kiosk = await this.kiosksRepository.findByTokenHash(tokenHash);

    if (!kiosk || kiosk.status !== 'ACTIVE') {
      await this.auditFailedAuthentication(
        kiosk?.organizationId,
        kiosk?.id,
        kiosk ? 'inactive_device' : 'unknown_credential',
      );
      throw new KioskAuthenticationException();
    }

    const [organization] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, kiosk.organizationId))
      .limit(1);

    const expires = new Date(Date.now() + KIOSK_SESSION_DURATION);
    const sessionToken = this.createSessionToken(kiosk, expires);

    await this.kiosksRepository.touchLastSeen(kiosk.id, kiosk.organizationId);

    return {
      kioskId: kiosk.id,
      name: kiosk.name,
      organizationName: organization?.name ?? '',
      expiresAt: expires.toISOString(),
      sessionToken,
    };
  }

  async resolveActiveDevice(sessionToken: string): Promise<KioskDeviceContext> {
    let claims: KioskSessionClaims;
    try {
      claims = jwt.verify(
        sessionToken,
        process.env.JWT_SECRET!,
        { algorithms: ['HS256'], audience: 'kiosk', issuer: 'rona-erp' },
      ) as KioskSessionClaims;
      if (!claims.jti || !claims.tokenVersion || typeof claims.kioskId !== 'string') {
        throw new Error('Invalid kiosk session');
      }
    } catch {
      throw new KioskAuthenticationException();
    }

    const [kiosk] = await db
      .select({
        id: kiosks.id,
        organizationId: kiosks.organizationId,
        status: kiosks.status,
        deviceId: kiosks.deviceId,
        tokenHash: kiosks.tokenHash,
      })
      .from(kiosks)
      .where(eq(kiosks.id, claims.kioskId))
      .limit(1);

    if (!kiosk || kiosk.status !== 'ACTIVE' || kiosk.organizationId !== claims.organizationId ||
      kiosk.deviceId !== claims.deviceId || this.hashToken(kiosk.tokenHash) !== claims.tokenVersion) {
      throw new KioskAuthenticationException();
    }

    return {
      kioskId: kiosk.id,
      deviceId: kiosk.deviceId,
      organizationId: kiosk.organizationId,
      sessionHash: this.hashToken(sessionToken),
      tokenVersion: claims.tokenVersion,
    };
  }

  async touchLastSeen(kioskId: string, organizationId: string) {
    await this.kiosksRepository.touchLastSeen(kioskId, organizationId);
  }

  async punch(
    context: KioskDeviceContext,
    input: KioskPunchInput,
    grant: unknown,
  ): Promise<KioskPunchResult> {
    const allowed = await rateLimit(
      `kiosk:punch:attempts:${context.kioskId}`,
      KIOSK_PUNCH_ATTEMPT_LIMIT,
      KIOSK_PUNCH_WINDOW_SECONDS,
    );
    if (!allowed) {
      throw new HttpException(
        'Too many attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return this.webauthnService.punch(context, input, grant);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private createSessionToken(
    kiosk: { id: string; deviceId: string; organizationId: string; tokenHash: string },
    expires: Date,
  ): string {
    return jwt.sign(
      {
        kioskId: kiosk.id,
        deviceId: kiosk.deviceId,
        organizationId: kiosk.organizationId,
        tokenVersion: this.hashToken(kiosk.tokenHash),
      },
      process.env.JWT_SECRET!,
      { expiresIn: Math.floor((expires.getTime() - Date.now()) / 1000),
        algorithm: 'HS256', audience: 'kiosk', issuer: 'rona-erp', jwtid: randomBytes(16).toString('hex') },
    );
  }

  private currentOrganizationId(): string {
    const ctx = getRequestContext();
    if (!ctx?.organizationId) {
      throw new KioskAuthenticationException();
    }
    return ctx.organizationId;
  }

  private async auditFailedAuthentication(
    organizationId: string | undefined,
    kioskId: string | undefined,
    reason: string,
  ): Promise<void> {
    try {
      if (!organizationId) return;
      await this.auditService.record({
        organizationId,
        entityId: kioskId,
        action: 'kiosk.auth.failed',
        entityType: 'kiosk',
        after: { reason },
      });
    } catch (error) {
      this.logger.warn(`kiosk auth audit failed: ${String(error)}`);
    }
  }

  private toDto(row: {
    id: string;
    organizationId: string;
    deviceId: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    registeredAt: Date;
    lastSeenAt: Date | null;
  }): Kiosk {
    return {
      id: row.id,
      organizationId: row.organizationId,
      deviceId: row.deviceId,
      name: row.name,
      status: row.status,
      registeredAt: row.registeredAt,
      lastSeenAt: row.lastSeenAt,
    };
  }
}
