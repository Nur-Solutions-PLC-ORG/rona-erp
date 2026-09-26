import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class KioskNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Kiosk not found');
  }
}

export class KioskAlreadyActiveException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'Kiosk is already active');
  }
}

export class KioskAlreadyInactiveException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'Kiosk is already inactive');
  }
}

export class KioskAuthenticationException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'This device is not registered or is not allowed to use kiosk terminals.',
    );
  }
}

export class KioskTokenConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'This device credential is already in use. Choose a different one.',
    );
  }
}

export class KioskEmployeeNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'No employee found with this Employee ID.');
  }
}

export class KioskEmployeeInactiveException extends ApiException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      'This employee is not active and cannot record attendance.',
    );
  }
}

export class KioskInvalidPasscodeException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      'The passcode is invalid. Confirm the employee has a kiosk passcode set up.',
    );
  }
}

export class KioskFaceNotRecognizedException extends ApiException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, 'Face does not match EID.');
  }
}

export class WebAuthnChallengeInvalidException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      'The WebAuthn challenge is expired or invalid. Please try again.',
    );
  }
}

export class WebAuthnCredentialNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'No WebAuthn credential matches this request.');
  }
}

export class WebAuthnVerificationFailedException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      'The WebAuthn response could not be verified.',
    );
  }
}

export class WebAuthnCredentialAlreadyExistsException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'This WebAuthn credential is already registered.',
    );
  }
}
