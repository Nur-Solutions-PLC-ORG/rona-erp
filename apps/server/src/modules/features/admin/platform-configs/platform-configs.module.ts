import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { PlatformConfigsController } from './platform-configs.controller';
import { PlatformConfigsRepository } from './platform-configs.repository';
import { PlatformConfigsService } from './platform-configs.service';

@Module({
  imports: [AuthModule],
  controllers: [PlatformConfigsController],
  providers: [PlatformConfigsService, PlatformConfigsRepository],
})
export class PlatformConfigsModule {}
