import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyStatus, PropertyType } from '@prisma/client';
import { AddressDto } from './address.dto';

export class CreatePropertyDto {
  @ApiProperty({
    example: 'Apartamento 2 quartos centro',
    description: 'Título do anúncio',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Apartamento amplo com vista para o parque',
    description: 'Descrição detalhada do imóvel',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: PropertyType,
    description: 'Tipo do imóvel',
  })
  @IsOptional()
  @IsEnum(PropertyType)
  property_type?: PropertyType;

  @ApiProperty({
    example: 350000,
    description: 'Preço em reais',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 85.5,
    description: 'Área em m²',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Quantidade de quartos',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({
    enum: PropertyStatus,
    default: PropertyStatus.RASCUNHO,
    description:
      'RASCUNHO (não visível em /listings), DISPONIVEL (publicado) ou VENDIDO (vendido)',
    enumName: 'PropertyStatus',
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiProperty({
    description: 'Endereço do imóvel (obrigatório)',
    type: () => AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
