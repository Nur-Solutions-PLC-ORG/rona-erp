import { Injectable } from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';

@Injectable()
export class AppService {
  getWelcome(): ApiResponse<string> {
    return {
      success: true,
      message: 'Welcome to Rona API!!',
    };
  }
}
