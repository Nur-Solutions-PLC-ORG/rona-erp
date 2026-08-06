import { Module } from '@nestjs/common';
import { AdminController } from '../controller/admin.controller';
import { AdminService } from '../service/admin.service';
import { AuthModule } from '../../auth/module/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
