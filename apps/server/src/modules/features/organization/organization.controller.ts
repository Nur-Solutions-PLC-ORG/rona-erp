import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type {
  AuditListSearchParamsSchema,
  MemberCreateSchema,
  MembershipCandidateDto,
  MembershipCandidateSearchParams,
  MembershipCreateSchema,
  MembershipUpdateSchema,
  MembershipWithUserDto,
  OrganizationUpdateSchema,
  RoleDto,
  RoleUpdateSchema,
} from '@rona/types/tenancy';
import {
  auditListSearchParamsSchema,
  memberCreateSchema,
  membershipCandidateSearchParamsSchema,
  membershipCreateSchema,
  membershipUpdateSchema,
  organizationUpdateSchema,
  roleUpdateSchema,
} from '@rona/validation/tenancy';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { RequirePermissions } from '@/modules/rbac/require-permissions.decorator';
import { OrganizationService } from './organization.service';
import { MembershipsService } from './memberships.service';

@Controller()
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly membershipsService: MembershipsService,
  ) {}

  @Get()
  @RequirePermissions('organization.read')
  async getCurrentOrganization(): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization retrieved successfully.',
      data: await this.organizationService.getCurrentOrganization(),
    };
  }

  @Patch()
  @RequirePermissions('organization.update')
  async updateOrganization(
    @Body(new ZodValidationPipe(organizationUpdateSchema))
    body: OrganizationUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization updated successfully.',
      data: await this.organizationService.updateOrganization(body),
    };
  }

  @Get('settings')
  @RequirePermissions('organization.read')
  async getSettings(): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Organization settings retrieved successfully.',
      data: await this.organizationService.getSettings(),
    };
  }

  @Get('memberships')
  @RequirePermissions('membership.read')
  async listMemberships(): Promise<ApiResponse<MembershipWithUserDto[]>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Memberships retrieved successfully.',
      data: await this.membershipsService.listMemberships(),
    };
  }

  @Get('users')
  @RequirePermissions('membership.create')
  async listMembershipCandidates(
    @Query(new ZodValidationPipe(membershipCandidateSearchParamsSchema))
    query: MembershipCandidateSearchParams,
  ): Promise<ApiResponse<MembershipCandidateDto[]>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User candidates retrieved successfully.',
      data: await this.membershipsService.searchCandidateUsers(
        query.searchQuery ?? '',
      ),
    };
  }

  @Post('memberships')
  @RequirePermissions('membership.create')
  async createMembership(
    @Body(new ZodValidationPipe(membershipCreateSchema))
    body: MembershipCreateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Membership created successfully.',
      data: await this.membershipsService.createMembership(body),
    };
  }

  @Post('members')
  @RequirePermissions('membership.create')
  async createMember(
    @Body(new ZodValidationPipe(memberCreateSchema))
    body: MemberCreateSchema,
  ): Promise<ApiResponse<{ email: string }>> {
    const credentials = await this.membershipsService.createMemberAccount(body);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Member created successfully.',
      data: credentials,
    };
  }

  @Get('memberships/:id')
  @RequirePermissions('membership.read')
  async getMembership(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<MembershipWithUserDto>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Membership retrieved successfully.',
      data: await this.membershipsService.getMembership(id),
    };
  }

  @Patch('memberships/:id')
  @RequirePermissions('membership.update')
  async updateMembership(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(membershipUpdateSchema))
    body: MembershipUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Membership updated successfully.',
      data: await this.membershipsService.updateMembership(id, body),
    };
  }

  @Delete('memberships/:id')
  @RequirePermissions('membership.delete')
  async deleteMembership(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<never>> {
    await this.membershipsService.deleteMembership(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Membership deleted successfully.',
    };
  }

  @Get('roles')
  @RequirePermissions('role.read')
  async listRoles(): Promise<ApiResponse<RoleDto[]>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Roles retrieved successfully.',
      data: await this.organizationService.listRoles(),
    };
  }

  @Patch('roles/:id')
  @RequirePermissions('role.update')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(roleUpdateSchema)) body: RoleUpdateSchema,
  ): Promise<ApiResponse<unknown>> {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Role updated successfully.',
      data: await this.organizationService.updateRolePermissions(id, body),
    };
  }

  @Get('audit-logs')
  @RequirePermissions('audit.read')
  async listAuditLogs(
    @Query(new ZodValidationPipe(auditListSearchParamsSchema))
    query: AuditListSearchParamsSchema,
  ): Promise<ApiResponse<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { records, meta } = await this.organizationService.listAuditLogs({
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,
      actorId: query.actorId,
      limit,
      offset: (page - 1) * limit,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Audit logs retrieved successfully.',
      data: records,
      meta: {
        ...meta,
        page,
        limit,
        totalPages: Math.ceil(meta.totalItems / limit),
      },
    };
  }
}
