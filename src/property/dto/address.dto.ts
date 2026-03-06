import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BrazilianState } from '../../common/enums/brazilian-state.enum';

/**
 * DTO de endereço (usado em Property e User)
 * Campos id e property_id são aceitos quando o frontend reenvia o objeto retornado pela API (ignorados no create/update).
 */
export class AddressDto {
  @ApiPropertyOptional({ description: 'Ignorado no create/update (retornado pela API)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Ignorado no create/update (Property)' })
  @IsOptional()
  @IsString()
  property_id?: string;

  @ApiPropertyOptional({ description: 'Ignorado no create/update (User)' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores', description: 'Logradouro' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: '123', description: 'Número' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({ example: 'Centro', description: 'Bairro' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo', description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'São Paulo',
    description: 'Estado (nome completo, ex.: São Paulo, Minas Gerais)',
    enum: BrazilianState,
  })
  @IsOptional()
  @IsEnum(BrazilianState)
  state?: BrazilianState;

  @ApiPropertyOptional({ example: 'Brasil', description: 'País' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: '01310-100',
    description: 'CEP (usado para recomendações por proximidade)',
  })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional({ example: -23.5505, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -46.6333, description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  lng?: number;
}
