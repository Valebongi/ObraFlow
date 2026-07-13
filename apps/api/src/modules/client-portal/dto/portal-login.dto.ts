import { IsEmail, IsString, MinLength } from 'class-validator';

export class PortalLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  orgCode: string;
}
