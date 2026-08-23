import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { OrganizationSettingsController } from './organization-settings.controller';
import { OrganizationSettingsRepository } from './organization-settings.repository';
import { OrganizationSettingsService } from './organization-settings.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationSettingsController],
  providers: [OrganizationSettingsService, OrganizationSettingsRepository],
})
export class OrganizationSettingsModule {}
