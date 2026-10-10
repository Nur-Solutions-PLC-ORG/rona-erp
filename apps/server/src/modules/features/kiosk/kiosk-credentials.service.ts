import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { pooledDb } from '@/db';
import type {
  EmployeeBiometricTemplate,
  EmployeeCard,
  EmployeeCredentialsResult,
  KioskCardBindInput,
  KioskCardSyncEntry,
  KioskCardSyncResult,
  KioskTemplateEnrollInput,
  KioskTemplateSyncEntry,
  KioskTemplateSyncResult,
} from '@rona/types/kiosk';
import { AuditService } from '@/modules/audit/audit.service';
import { EmployeesRepository } from '@/modules/features/hr/employees.repository';
import {
  EmployeeArchivedException,
  EmployeeNotFoundException,
} from '@/modules/features/hr/hr.exception';
import {
  KioskCardConflictException,
  KioskCardNotFoundException,
  KioskTemplateNotFoundException,
} from './kiosk.exception';
import { KioskCredentialsRepository } from './kiosk-credentials.repository';
import {
  cardUidHash,
  decryptTemplate,
  encryptTemplate,
} from './kiosk-device.crypto';

type TemplateRow = Awaited<
  ReturnType<KioskCredentialsRepository['findTemplateById']>
> & {};
type CardRow = Awaited<
  ReturnType<KioskCredentialsRepository['findCardById']>
> & {};

export interface KioskEnrollActor {
  kioskId: string;
  userId: string;
}

/** Template encryption key: KIOSK_TEMPLATE_ENCRYPTION_KEY (base64, 32 bytes). */
export function resolveTemplateKey(
  env: NodeJS.ProcessEnv = process.env,
  warn: (message: string) => void = () => undefined,
): Buffer {
  const configured = env.KIOSK_TEMPLATE_ENCRYPTION_KEY?.trim();
  if (configured) {
    const key = Buffer.from(configured, 'base64');
    if (key.length !== 32) {
      throw new Error(
        'KIOSK_TEMPLATE_ENCRYPTION_KEY must be 32 bytes (base64)',
      );
    }
    return key;
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('KIOSK_TEMPLATE_ENCRYPTION_KEY is required in production');
  }
  warn(
    'KIOSK_TEMPLATE_ENCRYPTION_KEY is not set; deriving the template key from JWT_SECRET (development only).',
  );
  return createHash('sha256')
    .update(`rona-kiosk-templates:${env.JWT_SECRET ?? ''}`)
    .digest();
}

// Biometric templates and cards for native terminals and HR.
// Callers must have the tenant (organization) in the request context.
@Injectable()
export class KioskCredentialsService {
  private readonly logger = new Logger(KioskCredentialsService.name);
  private key?: Buffer;

  constructor(
    private readonly credentialsRepository: KioskCredentialsRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly auditService: AuditService,
  ) {}

  async enrollTemplate(
    organizationId: string,
    actor: KioskEnrollActor,
    input: KioskTemplateEnrollInput,
  ): Promise<KioskTemplateSyncEntry> {
    await this.requireUsableEmployee(input.employeeId);
    const fingerIndex = input.fingerIndex ?? null;
    const ciphertext = encryptTemplate(this.templateKey(), input.template);

    const row = await pooledDb.transaction(async (tx) => {
      const revoked = await this.credentialsRepository.revokeActiveTemplates(
        input.employeeId,
        input.kind,
        fingerIndex,
        tx,
      );
      const created = await this.credentialsRepository.insertTemplate(
        {
          employeeId: input.employeeId,
          kind: input.kind,
          fingerIndex,
          algorithmVersion: input.algorithmVersion,
          templateCiphertext: ciphertext,
          enrolledByKioskId: actor.kioskId,
          enrolledByUserId: actor.userId,
          consentAt: input.consentAt,
        },
        tx,
      );
      await this.auditService.record(
        {
          organizationId,
          actorId: actor.userId,
          action: 'hr.credential.template.enroll',
          entityType: 'employee_biometric_template',
          entityId: created.id,
          after: {
            employeeId: input.employeeId,
            kind: input.kind,
            fingerIndex,
            algorithmVersion: input.algorithmVersion,
            kioskId: actor.kioskId,
            replaced: revoked.map((r) => r.id),
          },
        },
        tx,
      );
      return created;
    });

    return { ...this.toSyncEntry(row), template: input.template };
  }

  async revokeTemplateFromKiosk(
    organizationId: string,
    actor: KioskEnrollActor,
    templateId: string,
  ): Promise<KioskTemplateSyncEntry> {
    const row = await this.revokeTemplateRow(organizationId, templateId, {
      actorId: actor.userId,
      kioskId: actor.kioskId,
    });
    return this.toSyncEntry(row);
  }

  async syncTemplates(since?: Date): Promise<KioskTemplateSyncResult> {
    const serverTime = new Date();
    const rows = await this.credentialsRepository.listTemplatesSince(since);
    return {
      serverTime: serverTime.toISOString(),
      templates: rows.map((row) => this.toSyncEntry(row)),
    };
  }

  async bindCard(
    organizationId: string,
    actor: KioskEnrollActor,
    input: KioskCardBindInput,
  ): Promise<KioskCardSyncEntry> {
    await this.requireUsableEmployee(input.employeeId);
    const uid = input.uid.toUpperCase();
    const uidHash = cardUidHash(organizationId, uid);

    const existing =
      await this.credentialsRepository.findActiveCardByHash(uidHash);
    if (existing) {
      if (existing.employeeId !== input.employeeId) {
        throw new KioskCardConflictException();
      }
      return this.toCardSyncEntry(existing);
    }

    const row = await pooledDb.transaction(async (tx) => {
      const created = await this.credentialsRepository.insertCard(
        {
          employeeId: input.employeeId,
          uidHash,
          uidSuffix: uid.slice(-4),
          label: input.label ?? null,
        },
        tx,
      );
      await this.auditService.record(
        {
          organizationId,
          actorId: actor.userId,
          action: 'hr.credential.card.bind',
          entityType: 'employee_card',
          entityId: created.id,
          after: {
            employeeId: input.employeeId,
            uidSuffix: created.uidSuffix,
            kioskId: actor.kioskId,
          },
        },
        tx,
      );
      return created;
    });

    return this.toCardSyncEntry(row);
  }

  async syncCards(since?: Date): Promise<KioskCardSyncResult> {
    const serverTime = new Date();
    const rows = await this.credentialsRepository.listCardsSince(since);
    return {
      serverTime: serverTime.toISOString(),
      cards: rows.map((row) => this.toCardSyncEntry(row)),
    };
  }

  // HR (web admin)

  async listEmployeeCredentials(
    employeeId: string,
  ): Promise<EmployeeCredentialsResult> {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();

    const [templates, cards] = await Promise.all([
      this.credentialsRepository.listTemplatesForEmployee(employeeId),
      this.credentialsRepository.listCardsForEmployee(employeeId),
    ]);
    return {
      templates,
      cards: cards.map((card) => this.toEmployeeCard(card)),
    };
  }

  async revokeEmployeeTemplate(
    organizationId: string,
    employeeId: string,
    templateId: string,
  ): Promise<EmployeeBiometricTemplate> {
    const existing =
      await this.credentialsRepository.findTemplateById(templateId);
    if (!existing || existing.employeeId !== employeeId) {
      throw new KioskTemplateNotFoundException();
    }
    await this.revokeTemplateRow(organizationId, templateId, {});
    const templates =
      await this.credentialsRepository.listTemplatesForEmployee(employeeId);
    const revoked = templates.find((t) => t.id === templateId);
    if (!revoked) throw new KioskTemplateNotFoundException();
    return revoked;
  }

  async revokeEmployeeCard(
    organizationId: string,
    employeeId: string,
    cardId: string,
  ): Promise<EmployeeCard> {
    const existing = await this.credentialsRepository.findCardById(cardId);
    if (!existing || existing.employeeId !== employeeId) {
      throw new KioskCardNotFoundException();
    }
    if (existing.revokedAt) return this.toEmployeeCard(existing);

    const row = await pooledDb.transaction(async (tx) => {
      const revoked = await this.credentialsRepository.revokeCard(cardId, tx);
      if (!revoked) throw new KioskCardNotFoundException();
      await this.auditService.record(
        {
          organizationId,
          action: 'hr.credential.card.revoke',
          entityType: 'employee_card',
          entityId: cardId,
          before: { employeeId, uidSuffix: existing.uidSuffix },
          after: { revokedAt: revoked.revokedAt?.toISOString() },
        },
        tx,
      );
      return revoked;
    });
    return this.toEmployeeCard(row);
  }

  private async revokeTemplateRow(
    organizationId: string,
    templateId: string,
    actor: { actorId?: string; kioskId?: string },
  ): Promise<TemplateRow> {
    const existing =
      await this.credentialsRepository.findTemplateById(templateId);
    if (!existing) throw new KioskTemplateNotFoundException();
    if (existing.revokedAt) return existing;

    return pooledDb.transaction(async (tx) => {
      const revoked = await this.credentialsRepository.revokeTemplate(
        templateId,
        tx,
      );
      if (!revoked) throw new KioskTemplateNotFoundException();
      await this.auditService.record(
        {
          organizationId,
          ...(actor.actorId ? { actorId: actor.actorId } : {}),
          action: 'hr.credential.template.revoke',
          entityType: 'employee_biometric_template',
          entityId: templateId,
          before: { employeeId: existing.employeeId, kind: existing.kind },
          after: {
            revokedAt: revoked.revokedAt?.toISOString(),
            ...(actor.kioskId ? { kioskId: actor.kioskId } : {}),
          },
        },
        tx,
      );
      return revoked;
    });
  }

  private async requireUsableEmployee(employeeId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (employee.archivedAt) throw new EmployeeArchivedException();
    return employee;
  }

  private templateKey(): Buffer {
    this.key ??= resolveTemplateKey(process.env, (message) =>
      this.logger.warn(message),
    );
    return this.key;
  }

  private toSyncEntry(row: TemplateRow): KioskTemplateSyncEntry {
    return {
      id: row.id,
      employeeId: row.employeeId,
      kind: row.kind,
      fingerIndex: row.fingerIndex,
      algorithmVersion: row.algorithmVersion,
      template: row.revokedAt
        ? null
        : decryptTemplate(this.templateKey(), row.templateCiphertext),
      createdAt: row.createdAt.toISOString(),
      revokedAt: row.revokedAt?.toISOString() ?? null,
    };
  }

  private toCardSyncEntry(row: CardRow): KioskCardSyncEntry {
    return {
      id: row.id,
      employeeId: row.employeeId,
      uidHash: row.uidHash,
      revokedAt: row.revokedAt?.toISOString() ?? null,
    };
  }

  private toEmployeeCard(row: CardRow): EmployeeCard {
    return {
      id: row.id,
      employeeId: row.employeeId,
      label: row.label,
      uidSuffix: row.uidSuffix,
      createdAt: row.createdAt,
      revokedAt: row.revokedAt,
    };
  }
}
