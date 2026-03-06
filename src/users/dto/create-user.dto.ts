import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'João Silva', description: 'Nome completo' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'usuario@email.com', description: 'E-mail único' })
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
    description: 'Papel: CORRETOR ou COMPRADOR',
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

  @ApiPropertyOptional({
    example: '11999998888',
    description: 'Telefone',
  })
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

  @ApiPropertyOptional({
    default: true,
    description: 'Conta ativa (false = desativada)',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'E-mail verificado (corretor precisa para criar imóveis)',
  })
  @IsOptional()
  @IsBoolean()
  is_email_verified?: boolean;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Renda mensal em reais (para recomendações)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  renda_mensal?: number;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Valor da entrada em reais (para recomendações)',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_entrada?: number;
}
