import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'E-mail da conta para recuperação de senha',
  })
  @IsEmail()
  email: string;
}
