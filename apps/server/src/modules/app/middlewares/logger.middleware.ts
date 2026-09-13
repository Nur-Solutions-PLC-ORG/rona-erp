import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const started = process.hrtime.bigint();

    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - started) / 1_000_000;

      const { method, originalUrl } = req;
      const { statusCode } = res;

      let statusColor = '\x1b[32m';

      if (statusCode >= 500) statusColor = '\x1b[31m';
      else if (statusCode >= 400) statusColor = '\x1b[33m';
      else if (statusCode >= 300) statusColor = '\x1b[36m';

      this.logger.log(
        `\n${method.padEnd(6)} ${originalUrl.padEnd(40)} ${statusColor}${statusCode}\x1b[0m ${duration.toFixed(
          1,
        )}ms`,
      );
    });

    next();
  }
}
