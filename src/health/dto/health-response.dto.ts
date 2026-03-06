import { ApiProperty } from '@nestjs/swagger';

/**
 * Status de um indicador de saúde individual (Firebase ou Supabase)
 */
export class HealthIndicatorStatusDto {
  @ApiProperty({
    example: 'up',
    enum: ['up', 'down'],
    description: 'Status do serviço: up (operacional) ou down (indisponível)',
  })
  status: 'up' | 'down';

  @ApiProperty({
    example: 'Cloud Firestore API has not been enabled',
    required: false,
    description: 'Mensagem de erro quando o status é down',
  })
  error?: string;
}

/**
 * Resposta do health check quando todos os serviços estão operacionais
 */
export class HealthOkResponseDto {
  @ApiProperty({
    example: 'ok',
    enum: ['ok'],
    description: 'Indica que todos os serviços estão saudáveis',
  })
  status: 'ok';

  @ApiProperty({
    description: 'Status de cada serviço verificado',
    example: {
      firebase: { status: 'up' },
      mail: { status: 'up' },
      supabase: { status: 'up' },
    },
  })
  info: Record<string, HealthIndicatorStatusDto>;
}

/**
 * Resposta do health check quando algum serviço está indisponível
 */
export class HealthErrorResponseDto {
  @ApiProperty({
    example: 'error',
    enum: ['error'],
    description: 'Indica que um ou mais serviços estão indisponíveis',
  })
  status: 'error';

  @ApiProperty({
    required: false,
    description: 'Serviços que estão operacionais',
  })
  info?: Record<string, HealthIndicatorStatusDto>;

  @ApiProperty({
    required: false,
    description: 'Serviços que falharam na verificação',
  })
  error?: Record<string, HealthIndicatorStatusDto>;

  @ApiProperty({
    description: 'Detalhes consolidados de todos os indicadores',
  })
  details: Record<string, HealthIndicatorStatusDto>;
}
