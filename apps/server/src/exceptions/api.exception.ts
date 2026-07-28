import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';

export class ApiException extends HttpException {
  constructor(status: HttpStatus, message: string) {
    super(
      {
        success: false,
        message,
      } as ApiResponse<void>,
      status,
    );
  }
}
