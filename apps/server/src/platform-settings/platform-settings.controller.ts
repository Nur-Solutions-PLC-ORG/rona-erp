import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(private readonly platformSettingsService: PlatformSettingsService) {}

  @Public()
  @Get('status')
  async getStatus() {
    const isMaintenance = await this.platformSettingsService.isMaintenanceMode();
    const message = await this.platformSettingsService.getMaintenanceMessage();
    return { isMaintenance, message };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('maintenance')
  async setMaintenance(@CurrentUser() user: any, @Body() body: { enabled: boolean; message?: string }) {
    await this.platformSettingsService.setSetting('maintenance_mode', body.enabled ? 'true' : 'false');
    if (body.message) {
      await this.platformSettingsService.setSetting('maintenance_message', body.message);
    }
    return { success: true, isMaintenance: body.enabled };
  }
}
