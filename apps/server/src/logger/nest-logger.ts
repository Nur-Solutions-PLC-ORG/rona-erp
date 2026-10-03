import type { LoggerService } from '@nestjs/common';
import { logger } from '@/logger';

export class NestPinoLogger implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]): void {
    logger.info(this.bindings(optionalParams), this.format(message));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    logger.error(this.bindings(optionalParams), this.format(message));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    logger.warn(this.bindings(optionalParams), this.format(message));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    logger.debug(this.bindings(optionalParams), this.format(message));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    logger.trace(this.bindings(optionalParams), this.format(message));
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    logger.fatal(this.bindings(optionalParams), this.format(message));
  }

  private format(message: unknown): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) return message.message;
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private bindings(optionalParams: unknown[]): Record<string, unknown> {
    const [stack, context] = optionalParams;
    const extra: Record<string, unknown> = {};
    if (typeof stack === 'string') extra.stack = stack;
    if (typeof context === 'string') extra.context = context;
    return extra;
  }
}
