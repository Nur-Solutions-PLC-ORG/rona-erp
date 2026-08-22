import { Module } from '@nestjs/common';
import { UsersModule } from '../features/admin/users/users.module';

@Module({
  imports: [UsersModule],
  exports: [],
})
export class AdminModule {}
