import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { UserRole } from '@prisma/client';
import { AddressDto } from '../../property/dto/address.dto';

const toNumber = (value: unknown) => {
  if (value === '' || value === undefined) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

export class UpdateProfileDto {
  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Tipo de conta: COMPRADOR ou CORRETOR',
    example: UserRole.COMPRADOR,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'João Silva', description: 'Nome do usuário' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '12345-F',
    description: 'CRECI - Registro no Conselho Regional (apenas para CORRETOR)',
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

  @ApiPropertyOptional({ example: 5000, description: 'Renda mensal em reais' })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(0, { message: 'Renda mensal deve ser maior ou igual a zero' })
  renda_mensal?: number;

  @ApiPropertyOptional({ example: 50000, description: 'Valor da entrada em reais' })
  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(0, { message: 'Valor da entrada deve ser maior ou igual a zero' })
  valor_entrada?: number;

  @ApiPropertyOptional({
    description: 'Endereço do usuário (usado para recomendações de imóveis)',
    type: () => AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
