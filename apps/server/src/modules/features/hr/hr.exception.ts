import { HttpStatus } from '@nestjs/common';
import { ApiException } from '@/exceptions/api.exception';

export class EmployeeNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Employee not found');
  }
}

export class EmployeeEidConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'An employee with this EID already exists in this organization',
    );
  }
}

export class EmployeeUserConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'This user is already linked to another employee in this organization',
    );
  }
}

export class EmployeeArchivedException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'Employee is archived and cannot be used in HR operations',
    );
  }
}

export class EmployeeNotArchivedException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'Employee is not archived');
  }
}

export class LinkedUserNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Linked user not found');
  }
}

export class EmergencyContactNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Emergency contact not found');
  }
}

export class AttendanceSequenceConflictException extends ApiException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message);
  }
}

export class AttendanceFutureEventException extends ApiException {
  constructor() {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Attendance events cannot be recorded in the future',
    );
  }
}

export class AttendanceManagePermissionException extends ApiException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      'Recording attendance with an explicit event time requires the hr.attendance.manage permission',
    );
  }
}

export class EmployeeSelfNotFoundException extends ApiException {
  constructor() {
    super(
      HttpStatus.NOT_FOUND,
      'No employee record is linked to your user account in this organization',
    );
  }
}

export class DepartmentNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Department not found');
  }
}

export class DepartmentCodeConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'A department with this code already exists in this organization',
    );
  }
}

export class PositionNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Position not found');
  }
}

export class PositionCodeConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'A position with this code already exists in this organization',
    );
  }
}

export class PositionArchivedException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'Position is archived and cannot be used in HR operations',
    );
  }
}

export class PositionNotArchivedException extends ApiException {
  constructor() {
    super(HttpStatus.CONFLICT, 'Position is not archived');
  }
}

export class PositionInUseException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'Position is assigned to active employees and cannot be archived',
    );
  }
}

export class ShiftNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Shift not found');
  }
}

export class ShiftCodeConflictException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      'A shift with this code already exists in this organization',
    );
  }
}

export class EmployeeShiftNotFoundException extends ApiException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'Shift assignment not found');
  }
}

export class EmployeeShiftConflictException extends ApiException {
  constructor(message: string) {
    super(HttpStatus.CONFLICT, message);
  }
}

export class EmployeeFaceNotFoundException extends ApiException {
  constructor() {
    super(
      HttpStatus.NOT_FOUND,
      'This face is not enrolled for the employee.',
    );
  }
}
