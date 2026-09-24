import { HttpException, HttpStatus } from '@nestjs/common';

export class AiNotConfiguredException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        message: 'The AI assistant is not configured for this organization.',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class AiQuotaExhaustedException extends HttpException {
  constructor(retryAfterSeconds?: number) {
    const seconds = retryAfterSeconds
      ? Math.max(1, Math.round(retryAfterSeconds))
      : null;
    super(
      {
        success: false,
        message:
          'The AI request quota is currently exhausted. Please retry later.',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        ...(seconds ? { retryAfterSeconds: seconds } : {}),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
    if (seconds) {
      (this as unknown as { retryAfterSeconds: number }).retryAfterSeconds =
        seconds;
    }
  }
}

export class AiLlmUnavailableException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        message: 'The AI service is temporarily unavailable.',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class AiDataSourceException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        message: 'The data source is temporarily unavailable.',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class AiReportNotReadyException extends HttpException {
  constructor() {
    super(
      {
        success: false,
        message: 'Report not found.',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class AiDomainAccessException extends HttpException {
  constructor(domainLabel: string) {
    super(
      {
        success: false,
        message: `You do not have access to ${domainLabel} data.`,
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
