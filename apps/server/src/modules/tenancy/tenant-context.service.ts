import { Injectable } from '@nestjs/common';
import { getRequestContext } from '@/context/request-context';
import type { RequestContext } from '@/context/request-context';
import { NoActiveMembershipException } from './tenancy.exception';

@Injectable()
export class TenantContextService {
  get context(): RequestContext | undefined {
    return getRequestContext();
  }

  get organizationId(): string {
    const ctx = getRequestContext();
    if (!ctx?.organizationId) {
      throw new NoActiveMembershipException();
    }
    return ctx.organizationId;
  }

  get userId(): string {
    const ctx = getRequestContext();
    if (!ctx?.userId) {
      throw new NoActiveMembershipException();
    }
    return ctx.userId;
  }

  get userIdOrNull(): string | null {
    return getRequestContext()?.userId ?? null;
  }

  get membershipId(): string {
    const ctx = getRequestContext();
    if (!ctx?.membershipId) {
      throw new NoActiveMembershipException();
    }
    return ctx.membershipId;
  }

  get roles(): string[] {
    return getRequestContext()?.roles ?? [];
  }

  get permissions(): string[] {
    return getRequestContext()?.permissions ?? [];
  }

  get modules(): string[] {
    return getRequestContext()?.modules ?? [];
  }

  has(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}
