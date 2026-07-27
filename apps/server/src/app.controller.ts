import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { ServerStatus } from '@rona/types';
import { ServerStatusSchema } from '@rona/validation';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  getStatus(): ServerStatus {
    return {
      ok: true,
      message: 'Operational',
    };
  }
}
