import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { redisClient } from '@/redis';
import { RbacRepository } from './rbac.repository';
import type { Permission } from '@rona/types/tenancy';

export interface MembershipAccess {
  membershipId: string;
  organizationId: string;
  roles: string[];
  permissions: Permission[];
}

interface CacheEntry {
  access: MembershipAccess;
  cachedAt: number;
}

@Injectable()
export class RbacService implements OnModuleDestroy {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly versionKeyPrefix = 'rbac:version:';
  private static readonly CACHE_TTL_MS = 10 * 60 * 1000;
  private static readonly MAX_ENTRIES = 10_000;

  constructor(private readonly rbacRepository: RbacRepository) {}

  async resolveMembershipAccess(
    membershipId: string,
    organizationId: string,
  ): Promise<MembershipAccess> {
    const fallback: MembershipAccess = {
      membershipId,
      organizationId,
      roles: [],
      permissions: [],
    };

    const cacheKey = await this.buildCacheKey(membershipId, organizationId);

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < RbacService.CACHE_TTL_MS) {
      return cached.access;
    }
    if (cached) this.cache.delete(cacheKey);

    const access = await this.rbacRepository.resolveMembershipAccess(
      membershipId,
      organizationId,
    );

    const resolved = access
      ? {
          membershipId,
          organizationId,
          roles: access.roles,
          permissions: access.permissions,
        }
      : fallback;

    if (this.cache.size >= RbacService.MAX_ENTRIES) {
      let toEvict = Math.ceil(RbacService.MAX_ENTRIES / 10);
      for (const key of this.cache.keys()) {
        if (toEvict-- <= 0) break;
        this.cache.delete(key);
      }
    }
    this.cache.set(cacheKey, { access: resolved, cachedAt: Date.now() });
    return resolved;
  }

  async invalidateOrganization(organizationId: string): Promise<void> {
    try {
      await redisClient.set(
        `${this.versionKeyPrefix}${organizationId}`,
        Date.now().toString(),
        { ex: 86400 },
      );
    } catch {
      console.warn('Failed to bump RBAC version for org', organizationId);
    }

    for (const key of this.cache.keys()) {
      if (key.endsWith(`:${organizationId}`)) {
        this.cache.delete(key);
      }
    }
  }

  async invalidateMembership(
    membershipId: string,
    organizationId: string,
  ): Promise<void> {
    const cacheKey = await this.buildCacheKey(membershipId, organizationId);
    this.cache.delete(cacheKey);
    await this.invalidateOrganization(organizationId);
  }

  private async buildCacheKey(
    membershipId: string,
    organizationId: string,
  ): Promise<string> {
    let version = '0';
    try {
      version =
        (await redisClient.get(`${this.versionKeyPrefix}${organizationId}`)) ??
        '0';
    } catch {
      console.warn('Failed to read RBAC version for org', organizationId);
    }
    return `rbac:access:${version}:${membershipId}:${organizationId}`;
  }

  onModuleDestroy() {
    this.cache.clear();
  }
}
