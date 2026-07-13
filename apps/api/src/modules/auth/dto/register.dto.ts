import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeEmail, SanitizeText } from '../../../common/transforms/sanitize.transform';

export class RegisterDto {
  @ApiProperty({ example: 'Constructora ABC' })
  @IsString()
  @Length(2, 100)
  @SanitizeText()
  orgName: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @Length(2, 100)
  @SanitizeText()
  name: string;

  @ApiProperty({ example: 'juan@empresa.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @SanitizeEmail()
  email: string;

  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número',
  })
  password: string;
}
