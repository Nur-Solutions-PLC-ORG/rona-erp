import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../exceptions/api.exception';

export class InvalidCodeException extends ApiException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, 'The verification code is invalid.');
  }
}

export class WaitForResendException extends ApiException {
  constructor() {
    super(
      HttpStatus.TOO_MANY_REQUESTS,
      'Please wait before requesting a new code.',
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

export class UserNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'No account found with this email address.');
  }
}

export class InvalidResetTokenException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      'The password reset code is invalid or expired.',
    );
  }
}

export class TooManyAttemptsException extends ApiException {
  constructor(message = 'Too many attempts. Please try again later.') {
    super(HttpStatus.TOO_MANY_REQUESTS, message);
  }
}
