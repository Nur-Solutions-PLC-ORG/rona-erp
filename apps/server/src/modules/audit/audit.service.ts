import { Injectable } from '@nestjs/common';
import type { Executor } from '@/db/executor';
import { getRequestContext } from '@/context/request-context';
import { AuditRepository, type AuditListFilters } from './audit.repository';
import type { AuditLogDto } from '@rona/types/tenancy';

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|jwt|authorization|credential|apikey|api_key/i;

function redactSensitiveData(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item));
  }
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? '[REDACTED]'
        : redactSensitiveData(entry);
    }
    return result;
  }
  return value;
}

export interface AuditRecordInput {
  organizationId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async record(input: AuditRecordInput, tx?: Executor): Promise<void> {
    const requestContext = getRequestContext();

    await this.auditRepository.insert(
      {
        organizationId: input.organizationId,
        actorId: input.actorId ?? requestContext?.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: redactSensitiveData(input.before) ?? null,
        after: redactSensitiveData(input.after) ?? null,
        requestId: requestContext?.requestId ?? null,
        ip: requestContext?.ip ?? null,
        userAgent: requestContext?.userAgent ?? null,
      },
      tx,
    );
  }

  async list(
    organizationId: string,
    filters: AuditListFilters,
  ): Promise<AuditLogDto[]> {
    return this.auditRepository.list(organizationId, filters);
  }

  async count(
    organizationId: string,
    filters: Omit<AuditListFilters, 'limit' | 'offset'>,
  ): Promise<number> {
    return this.auditRepository.count(organizationId, filters);
  }
}
