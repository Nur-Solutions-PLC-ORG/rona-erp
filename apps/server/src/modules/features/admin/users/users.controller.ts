import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import type {
  UserDto,
  UserCredentialsDto,
  UserListSearchParamsSchema,
  UserSchema,
  UserUpdateSchema,
} from '@rona/types/admin';
import {
  userListSearchParamsSchema,
  userSchema,
  userUpdateSchema,
} from '@rona/validation/admin';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { Roles } from '@/modules/auth/guards/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ZodValidationPipe } from '@/modules/app/pipes/zod-validation.pipe';
import { UsersService } from './users.service';

@Controller()
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listUsers(
    @Query(new ZodValidationPipe(userListSearchParamsSchema))
    query: UserListSearchParamsSchema,
  ): Promise<ApiResponse<UserDto[]>> {
    const { users, meta } = await this.usersService.listUsers(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully.',
      data: users,
      meta,
    };
  }

  @Post()
  async createUser(
    @Body(new ZodValidationPipe(userSchema)) body: UserSchema,
  ): Promise<ApiResponse<UserCredentialsDto>> {
    const credentials = await this.usersService.createUser(body);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully.',
      data: credentials,
    };
  }

  @Post(':id/reset-password')
  async resetUserPassword(
    @Param('id') id: string,
  ): Promise<ApiResponse<UserCredentialsDto>> {
    const credentials = await this.usersService.resetUserPassword(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User password reset successfully.',
      data: credentials,
    };
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<ApiResponse<UserDto>> {
    const user = await this.usersService.getUser(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully.',
      data: user,
    };
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(userUpdateSchema)) body: UserUpdateSchema,
  ): Promise<ApiResponse<UserDto>> {
    const user = await this.usersService.updateUser(id, body);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User updated successfully.',
      data: user,
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<ApiResponse<never>> {
    await this.usersService.deleteUser(id);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User deleted successfully.',
    };
  }
}
