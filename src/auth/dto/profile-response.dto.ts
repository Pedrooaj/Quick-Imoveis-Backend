import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileAddressDto {
  @ApiPropertyOptional()
  street?: string;

  @ApiPropertyOptional()
  number?: string;

  @ApiPropertyOptional()
  neighborhood?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  postal_code?: string;

  @ApiPropertyOptional()
  lat?: number;

  @ApiPropertyOptional()
  lng?: number;
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  name: string | null;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'CRECI - Registro no Conselho Regional (apenas para CORRETOR)',
  })
  creci: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Telefone' })
  phone: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'WhatsApp (com DDI)' })
  whatsapp: string | null;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  is_email_verified: boolean;

  @ApiProperty({
    description:
      'Indica se o usuário ainda precisa escolher o tipo de conta (onboarding de role).',
    example: false,
  })
  needs_role: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'URL do avatar no Firebase Storage',
  })
  avatar: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Renda mensal em reais' })
  renda_mensal: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Valor da entrada em reais' })
  valor_entrada: number | null;

  @ApiProperty()
  created_at: Date;

  @ApiPropertyOptional({ nullable: true })
  last_login: Date | null;

  @ApiPropertyOptional({ type: ProfileAddressDto, nullable: true })
  address: ProfileAddressDto | null;
}
