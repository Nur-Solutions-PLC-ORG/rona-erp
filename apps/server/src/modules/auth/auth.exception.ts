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

// Thrown when a user is not found by email during forgot-password
export class UserNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'No account found with this email address.');
  }
}

// Thrown when a password reset token is invalid or has expired
export class InvalidResetTokenException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      'The password reset token is invalid or expired.',
    );
  }
}
