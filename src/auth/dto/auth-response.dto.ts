import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 'uuid-123', description: 'ID do usuário' })
  id: string;

  @ApiProperty({ example: 'João Silva', nullable: true, description: 'Nome' })
  name: string | null;

  @ApiProperty({ example: 'usuario@email.com', description: 'E-mail' })
  email: string;

  @ApiPropertyOptional({
    example: 'COMPRADOR',
    nullable: true,
    description: 'Papel: CORRETOR ou COMPRADOR',
  })
  role: string | null;

  @ApiProperty({ example: true, description: 'Conta ativa' })
  is_active: boolean;

  @ApiProperty({ example: false, description: 'E-mail verificado' })
  is_email_verified: boolean;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT de acesso (Bearer). Curta duração. Use no header Authorization.',
  })
  access_token: string;

  @ApiProperty({
    example: 900,
    description: 'Validade do access_token em segundos (ex.: 900 = 15 min).',
  })
  expires_in: number;

  @ApiProperty({ type: AuthUserDto, description: 'Dados do usuário autenticado' })
  user: AuthUserDto;
}
