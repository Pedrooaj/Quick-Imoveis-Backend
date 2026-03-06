import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'E-mail da conta',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Código de 6 dígitos enviado por e-mail (válido por 1 hora)',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: 'O código deve ter exatamente 6 dígitos' })
  code: string;

  @ApiProperty({
    example: 'novaSenha123',
    minLength: 6,
    description: 'Nova senha (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
  newPassword: string;
}
