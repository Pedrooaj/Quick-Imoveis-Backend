import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6g7h8i9j0...',
    description: 'Token recebido no link enviado por e-mail para verificação',
  })
  @IsString()
  @MinLength(1, { message: 'Token é obrigatório' })
  token: string;
}
