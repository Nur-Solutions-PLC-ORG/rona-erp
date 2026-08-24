import { generateCombinations } from '@/lib/combinations';
import { redisClient } from '@/redis';
import { Injectable } from '@nestjs/common';
import type {
  UserCredentialsDto,
  UserDto,
  UserListSearchParamsSchema,
  UserSchema,
  UserUpdateSchema,
} from '@rona/types/admin';
import * as bcrypt from 'bcrypt';
import {
  AdminUserEmailExistsException,
  AdminUserNotFoundException,
} from './users.exception';
import { UsersRepository } from './users.repository';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

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

    const password = this.generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await this.usersRepository.create(
      {
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        organizationId: data.organizationId,
        status: data.status,
      },
      {
        position: data.role.position,
        module: data.role.modules,
      },
    );

    return { email: data.email, password };
  }

  async resetUserPassword(id: string): Promise<UserCredentialsDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new AdminUserNotFoundException();

    const password = this.generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await this.usersRepository.update(id, { passwordHash });

    return { email: user.user.email, password };
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

    await this.usersRepository.update(
      id,
      {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.organizationId !== undefined
          ? { organizationId: data.organizationId }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      data.role
        ? {
            position: data.role.position,
            module: data.role.modules,
          }
        : undefined,
    );

    if (data.role) await redisClient.del(`auth:role:${id}`);
    return this.getUser(id);
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.usersRepository.delete(id);
    if (!deleted) throw new AdminUserNotFoundException();

    await redisClient.del(`auth:role:${id}`);
  }

  private toUserDto(record: {
    user: {
      id: string;
      fullName: string;
      email: string;
      organizationId: string | null;
      status: UserDto['status'];
      createdAt: Date;
    };
    role: UserDto['role'];
  }): UserDto {
    return {
      id: record.user.id,
      fullName: record.user.fullName,
      email: record.user.email,
      organizationId: record.user.organizationId,
      status: record.user.status,
      role: record.role,
      createdAt: record.user.createdAt,
    };
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
