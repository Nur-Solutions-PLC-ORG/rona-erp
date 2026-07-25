import { IsString, Length } from 'class-validator';

export class EnableMfaDto {
  @IsString()
  @Length(6, 6, { message: 'code must be 6 digits' })
  code!: string;
}

export class VerifyMfaDto {
  @IsString()
  @Length(6, 6, { message: 'code must be 6 digits' })
  code!: string;
}

export class DisableMfaDto {
  @IsString()
  @Length(6, 6, { message: 'code must be 6 digits' })
  code!: string;
}

export class MfaSetupResponse {
  secret!: string;
  qrCodeUrl!: string;
}
