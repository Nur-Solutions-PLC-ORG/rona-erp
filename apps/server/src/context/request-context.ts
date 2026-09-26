import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request, Response } from 'express';
import { generateRequestId } from '@/logger';
import { REQUEST_ID_HEADER } from '@rona/config/tenancy';

export interface RequestContext {
  requestId: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  organizationId?: string;
  membershipId?: string;
  roles: string[];
  permissions: string[];
  modules?: string[];
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function createRequestContext(
  req: Request,
  res: Response,
): RequestContext {
  const incomingRequestId = req.header(REQUEST_ID_HEADER);
  const requestId =
    incomingRequestId && incomingRequestId.length <= 128
      ? incomingRequestId
      : generateRequestId();

  res.setHeader(REQUEST_ID_HEADER, requestId);

  return {
    requestId,
    ip: req.ip,
    userAgent: req.header('user-agent'),
    roles: [],
    permissions: [],
    modules: [],
  };
}

export function runWithRequestContext<T>(
  context: RequestContext,
  callback: () => T,
): T {
  return requestContextStorage.run(context, callback);
}

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function patchRequestContext(patch: Partial<RequestContext>): void {
  const context = requestContextStorage.getStore();
  if (!context) return;
  Object.assign(context, patch);
}
