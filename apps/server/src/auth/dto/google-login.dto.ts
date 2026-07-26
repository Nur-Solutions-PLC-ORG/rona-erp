import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class GoogleLoginDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 2048, { message: 'incorrect id token' })
  @Matches(/^[A-Za-z0-9\-_]+\.([A-Za-z0-9\-_]+)\.([A-Za-z0-9\-_]+)$/, {
    message: 'idToken must be a valid JWT format',
  })
  idToken!: string;
}
