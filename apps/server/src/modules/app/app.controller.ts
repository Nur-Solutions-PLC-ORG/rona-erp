import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse } from '@rona/types/api';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): ApiResponse<string> {
    const message = this.appService.getWelcome();

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message,
    };
  }
}
