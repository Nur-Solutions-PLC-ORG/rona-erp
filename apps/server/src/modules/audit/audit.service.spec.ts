import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runWithRequestContext } from '@/context/request-context';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

jest.mock('@/db', () => ({
  db: {},
  pooledDb: { transaction: jest.fn() },
}));

const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_A = '11111111-1111-4111-8111-111111111111';

const insert = jest.fn();
const auditRepository = { insert } as unknown as AuditRepository;
const service = new AuditService(auditRepository);

function lastInsertValues(): Record<string, unknown> {
  const call = insert.mock.calls.at(-1) as
    [Record<string, unknown>, unknown] | undefined;
  if (!call) {
    throw new Error('audit repository insert was not called');
  }
  return call[0];
}

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insert.mockResolvedValue(undefined);
  });

  it('redacts sensitive values before persisting', async () => {
    await service.record({
      organizationId: ORG_A,
      action: 'test.action',
      entityType: 'test',
      before: {
        name: 'safe',
        password: 'super-secret-password',
        nested: { apiKey: 'abc123' },
      },
      after: {
        name: 'safe-2',
        token: 'jwt-token-value',
        authorization: 'Bearer credentials',
      },
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(lastInsertValues().before).toEqual({
      name: 'safe',
      password: '[REDACTED]',
      nested: { apiKey: '[REDACTED]' },
    });
    expect(lastInsertValues().after).toEqual({
      name: 'safe-2',
      token: '[REDACTED]',
      authorization: '[REDACTED]',
    });
  });

  it('enriches records with actor and request context', async () => {
    await runWithRequestContext(
      {
        requestId: 'req-42',
        ip: '203.0.113.10',
        userAgent: 'jest-agent/1.0',
        userId: USER_A,
        roles: [],
        permissions: [],
      },
      () =>
        service.record({
          organizationId: ORG_A,
          action: 'test.action',
          entityType: 'test',
        }),
    );

    const values = lastInsertValues();
    expect(values.actorId).toBe(USER_A);
    expect(values.requestId).toBe('req-42');
    expect(values.ip).toBe('203.0.113.10');
    expect(values.userAgent).toBe('jest-agent/1.0');
  });

  it('falls back to null context fields when no request context exists', async () => {
    await service.record({
      organizationId: ORG_A,
      action: 'test.action',
      entityType: 'test',
    });

    const values = lastInsertValues();
    expect(values.actorId).toBeNull();
    expect(values.requestId).toBeNull();
    expect(values.ip).toBeNull();
  });

  it('joins the caller transaction when one is provided', async () => {
    const tx = { insert: jest.fn() } as never;

    await service.record(
      { organizationId: ORG_A, action: 'test.action', entityType: 'test' },
      tx,
    );

    expect(insert).toHaveBeenCalledWith(expect.anything(), tx);
  });

  it('exposes only append operations on the repository (no update/delete)', () => {
    const methods = Object.getOwnPropertyNames(AuditRepository.prototype);
    expect(methods).toContain('insert');
    expect(methods).not.toContain('update');
    expect(methods).not.toContain('delete');
    expect(methods).not.toContain('remove');
  });

  it('enforces append-only at the database level via trigger', () => {
    const migration = readFileSync(
      join(__dirname, '../../../migrations/0004_tenancy_rbac_audit.sql'),
      'utf-8',
    );
    expect(migration).toContain('BEFORE UPDATE OR DELETE ON "audit_logs"');
    expect(migration).toContain(
      "current_setting('rona.allow_audit_delete', true)",
    );
    expect(migration).toContain('RAISE EXCEPTION');
  });
});
