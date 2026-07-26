import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as os from 'os';

@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof Error) {
      message = isProduction ? 'Internal server error' : exception.message;
    }
    const logMsg = `NestJS Exception: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}\n`;
    console.error(logMsg);
    try {
      const logPath = `${os.tmpdir()}/nestjs-error.log`;
      const fs = require('fs');
      const MAX_LOG_SIZE = 10 * 1024 * 1024;
      if (fs.existsSync(logPath) && fs.statSync(logPath).size > MAX_LOG_SIZE) {
        fs.writeFileSync(logPath, '');
      }
      fs.appendFileSync(logPath, logMsg);
    } catch (e) {}

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
