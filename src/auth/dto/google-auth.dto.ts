import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiPropertyOptional({
    description:
      'JWT do Google (validar com as chaves públicas do Google). Use id_token OU access_token.',
    example: 'eyJhbGciOiJSUzI1NiIs...',
  })
  @IsOptional()
  @IsString()
  id_token?: string;

  @ApiPropertyOptional({
    description:
      'Token OAuth do Google (alternativa ao id_token). Usado para buscar dados do usuário.',
    example: 'ya29.a0AfH6SMBx...',
  })
  @IsOptional()
  @IsString()
  access_token?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description:
      'Papel desejado ao criar a conta com Google. Se omitido, assume COMPRADOR.',
    example: UserRole.COMPRADOR,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
