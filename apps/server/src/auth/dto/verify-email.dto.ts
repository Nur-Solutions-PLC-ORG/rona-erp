import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Verification code must be 6 digits' })
  code!: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email!: string;
}
