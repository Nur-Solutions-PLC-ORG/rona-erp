import { IsNotEmpty, IsString, Length } from 'class-validator';

export class EnableMfaDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Code must be 6 digits' })
  code!: string;
}
