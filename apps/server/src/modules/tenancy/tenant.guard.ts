import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Session } from '@rona/types/auth';
import { patchRequestContext } from '@/context/request-context';
import { ORGANIZATION_HEADER } from '@rona/config/tenancy';
import {
  TenancyRepository,
  type ActiveMembershipWithOrganization,
  type MembershipAccess,
} from './tenancy.repository';
import { RbacService } from '@/modules/rbac/rbac.service';
import {
  InvalidOrganizationHeaderException,
  NoActiveMembershipException,
  OrganizationAccessDeniedException,
} from './tenancy.exception';

interface AuthenticatedRequest extends Request {
  session?: Session;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly tenancyRepository: TenancyRepository,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = request.session;

    if (!session?.user?.id) {
      throw new NoActiveMembershipException();
    }

    const userId = session.user.id;

    const headerOrganizationId = request.header(ORGANIZATION_HEADER);

    let organizationId: string | undefined;
    if (headerOrganizationId) {
      if (!UUID_PATTERN.test(headerOrganizationId)) {
        throw new InvalidOrganizationHeaderException();
      }
      organizationId = headerOrganizationId;
    }

    let membership:
      MembershipAccess | ActiveMembershipWithOrganization | undefined;
    if (organizationId) {
      membership = await this.tenancyRepository.findActiveMembershipAccess(
        userId,
        organizationId,
      );
      if (!membership) {
        throw new OrganizationAccessDeniedException();
      }
    } else {
      membership = await this.tenancyRepository.findDefaultMembership(userId);
      if (!membership) {
        throw new NoActiveMembershipException();
      }
    }

    const access = await this.rbacService.resolveMembershipAccess(
      membership.membershipId,
      membership.organizationId,
    );

    patchRequestContext({
      userId,
      organizationId: membership.organizationId,
      membershipId: membership.membershipId,
      roles: access.roles,
      permissions: access.permissions,
      modules: session.role?.modules ?? [],
    });

    return true;
  }
}
