import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @ApiPropertyOptional({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'usuario@email.com',
    description: 'E-mail (será usado para login)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'senha123',
    minLength: 6,
    description: 'Senha (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.COMPRADOR,
    description: 'Papel do usuário: CORRETOR ou COMPRADOR',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: '12345-F',
    description: 'CRECI - Registro no Conselho Regional (apenas CORRETOR)',
  })
  @IsOptional()
  @IsString()
  creci?: string;

  @ApiPropertyOptional({ example: '11999998888', description: 'Telefone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '5511999998888',
    description: 'WhatsApp (com DDI, ex: 5511999998888)',
  })
  @IsOptional()
  @IsString()
  whatsapp?: string;
}
