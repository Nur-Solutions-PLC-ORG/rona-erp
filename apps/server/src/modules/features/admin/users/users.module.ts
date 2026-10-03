import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AuthModule } from '@/modules/auth/auth.module';
import { RbacModule } from '@/modules/rbac/rbac.module';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [],
})
export class UsersModule {}
