import { generateCombinations } from '@/lib/combinations';
import { sendAccountCredentialsEmail } from '@/emails/mailer';
import { sendTelegramCredentialsToChat } from '@/emails/telegram';
import { redisClient } from '@/redis';
import { Injectable } from '@nestjs/common';
import type {
  UserCredentialsDto,
  UserDto,
  UserListSearchParamsSchema,
  UserSchema,
  UserUpdateSchema,
} from '@rona/types/admin';
import type { Position } from '@rona/types/auth';
import type { RoleKey } from '@rona/types/tenancy';
import { userDto } from '@rona/validation/admin';
import * as bcrypt from 'bcrypt';
import {
  AdminUserEmailExistsException,
  AdminUserNotFoundException,
} from './users.exception';
import { UsersRepository } from './users.repository';
import { RbacRepository } from '@/modules/rbac/rbac.repository';
import { RbacService } from '@/modules/rbac/rbac.service';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';

const POSITION_TO_ROLE: Record<Position, RoleKey> = {
  super_admin: 'OWNER',
  owner: 'OWNER',
  admin: 'ADMIN',
  manager: 'MANAGER',
  staff: 'EMPLOYEE',
};

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rbacRepository: RbacRepository,
    private readonly rbacService: RbacService,
  ) {}

  async listUsers(params: UserListSearchParamsSchema) {
    const { records, total } = await this.usersRepository.findMany(params);
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;

    return {
      users: records.map((record) => this.toUserDto(record)),
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(id: string): Promise<UserDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AdminUserNotFoundException();

    return this.toUserDto(user);
  }

  async createUser(data: UserSchema): Promise<UserCredentialsDto> {
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) throw new AdminUserEmailExistsException();

    const password = data.password ?? this.generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await this.usersRepository.create(
      {
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        organizationId: data.organizationId,
        status: data.status,
        mustChangePassword: true,
      },
      {
        position: data.role.position,
        module: data.role.modules,
      },
    );

    if (data.organizationId) {
      await this.ensureMembership(
        userId,
        data.organizationId,
        data.role.position,
      );
    }

    await sendAccountCredentialsEmail(data.email, password, data.fullName);

    return { email: data.email };
  }

  async resetUserPassword(id: string): Promise<UserCredentialsDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AdminUserNotFoundException();

    const password = this.generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await this.usersRepository.update(id, {
      passwordHash,
      mustChangePassword: true,
    });

    await sendAccountCredentialsEmail(
      user.user.email,
      password,
      user.user.fullName,
    );

    const telegramChatId =
      await this.usersRepository.findTelegramChatIdByUserId(id);
    if (telegramChatId) {
      await sendTelegramCredentialsToChat(
        telegramChatId,
        user.user.email,
        password,
        user.user.fullName,
      );
    }

    return { email: user.user.email };
  }

  async updateUser(id: string, data: UserUpdateSchema): Promise<UserDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AdminUserNotFoundException();

    if (data.email) {
      const existingUser = await this.usersRepository.findByEmailExceptId(
        data.email,
        id,
      );
      if (existingUser) throw new AdminUserEmailExistsException();
    }

    const previousOrganizationId = user.user.organizationId;
    const position = data.role?.position ?? user.role.position;

    const passwordHash =
      data.password !== undefined
        ? await bcrypt.hash(data.password, 10)
        : undefined;

    await this.usersRepository.update(
      id,
      {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.organizationId !== undefined
          ? { organizationId: data.organizationId }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(passwordHash !== undefined ? { passwordHash } : {}),
        ...(passwordHash !== undefined ? { mustChangePassword: true } : {}),
      },
      data.role
        ? {
            position: data.role.position,
            module: data.role.modules,
          }
        : undefined,
    );

    if (data.role) await redisClient.del(`auth:role:${id}`).catch(() => undefined);

    const organizationId =
      data.organizationId !== undefined
        ? data.organizationId
        : previousOrganizationId;

    const organizationChanged =
      data.organizationId !== undefined &&
      data.organizationId !== previousOrganizationId;
    const positionChanged =
      data.role?.position !== undefined &&
      data.role.position !== user.role.position;

    if (organizationChanged && previousOrganizationId) {
      await this.removeMembership(id, previousOrganizationId);
    }

    if (organizationId) {
      const membership = await this.usersRepository.findMembership(
        id,
        organizationId,
      );
      const needsSync =
        organizationChanged ||
        positionChanged ||
        !membership ||
        !(await this.matchesMappedRole(
          membership,
          organizationId,
          position,
        ));

      if (needsSync) {
        await this.ensureMembership(id, organizationId, position);
      }
    }

    return this.getUser(id);
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.usersRepository.delete(id);
    if (!deleted) throw new AdminUserNotFoundException();

    await redisClient.del(`auth:role:${id}`).catch(() => undefined);
  }

  private async ensureMembership(
    userId: string,
    organizationId: string,
    position: Position,
  ) {
    const roleKey = POSITION_TO_ROLE[position];

    await this.rbacRepository.upsertDefaultRoles(organizationId);

    const membership = await this.usersRepository.createMembership(
      userId,
      organizationId,
    );
    if (!membership) return;

    await this.rbacRepository.replaceMembershipRoles(
      membership.id,
      [roleKey],
      organizationId,
    );

    await this.rbacService.invalidateMembership(membership.id, organizationId);
  }

  private async removeMembership(userId: string, organizationId: string) {
    const membership = await this.usersRepository.findMembership(
      userId,
      organizationId,
    );
    if (!membership) return;

    await this.usersRepository.deleteMembership(userId, organizationId);
    await this.rbacService.invalidateMembership(membership.id, organizationId);
  }

  private async matchesMappedRole(
    membership: Awaited<ReturnType<UsersRepository['findMembership']>>,
    organizationId: string,
    position: Position,
  ): Promise<boolean> {
    if (!membership) return false;

    const roleKey = POSITION_TO_ROLE[position];
    const currentRoles = await this.rbacRepository.findMembershipRoleKeys(
      membership.id,
      organizationId,
    );
    return currentRoles.includes(roleKey);
  }

  private toUserDto(
    record: Awaited<ReturnType<UsersRepository['findById']>>,
  ): UserDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...user } = record.user;

    return userDto.parse({
      ...user,
      role: record.role,
    });
  }

  private generatePassword(): string {
    return generateCombinations({
      length: 10,
      includeNumbers: true,
      includeUppercase: true,
      includeLowercase: true,
      includeSymbols: false,
    });
  }
}
