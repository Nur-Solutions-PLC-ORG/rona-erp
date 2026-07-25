import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PlatformSettingsService } from './platform-settings.service';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private readonly platformSettingsService: PlatformSettingsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const isMaintenance = await this.platformSettingsService.isMaintenanceMode();
    if (isMaintenance) {
      const message = await this.platformSettingsService.getMaintenanceMessage();
      return res.status(503).json({
        statusCode: 503,
        message,
        data: null,
      });
    }
    next();
  }
}
