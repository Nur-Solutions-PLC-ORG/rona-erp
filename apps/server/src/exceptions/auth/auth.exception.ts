import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../api.exception';

export class InvalidCodeException extends ApiException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, 'The verification code is invalid.');
  }
}

export class WaitForResendException extends ApiException {
  constructor() {
    super(
      HttpStatus.TOO_MANY_REQUESTS,
      'Please wait before requesting a new verification code.',
    );
  }
}

export class InvalidCredentialsException extends ApiException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'The provided credentials are invalid.');
  }
}

export class UserRoleNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'The user role could not be found.');
  }
}

export class SessionNotFoundException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'The session could not be found or is no longer valid.',
    );
  }
}

export class SessionException extends ApiException {
  constructor() {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'The session could not be configured.',
    );
  }
}
