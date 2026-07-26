import { IsEmail, IsNotEmpty, IsString, Length, MinLength, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail({}, { message: 'bad email' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'code must be 6 digits' })
  code!: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'bad email' })
  @IsNotEmpty()
  email!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'bad email' })
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'bad email' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'reset code must be 6 digits' })
  code!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'password too short' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'password needs uppercase lowercase number and special char',
  })
  newPassword!: string;
}
