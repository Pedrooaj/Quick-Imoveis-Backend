import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import {
  HealthErrorResponseDto,
  HealthOkResponseDto,
} from './dto/health-response.dto';
import { FirebaseHealthIndicator } from './indicators/firebase.health';
import { MailHealthIndicator } from './indicators/mail.health';
import { PrismaHealthIndicator } from './indicators/prisma.health';

/**
 * Endpoints para verificação de saúde dos serviços da aplicação.
 * Utilizado por load balancers, orchestradores (Kubernetes) e ferramentas de monitoramento.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private firebase: FirebaseHealthIndicator,
    private mail: MailHealthIndicator,
    private prisma: PrismaHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Verificar saúde dos serviços',
    description:
      '**Público.** Verifica Firebase, Mail (SMTP) e Supabase (PostgreSQL). Retorna 200 (ok) ou 503 (erro). Ideal para probes de readiness/liveness.',
  })
  @ApiResponse({
    status: 200,
    description: 'Todos os serviços estão operacionais',
    type: HealthOkResponseDto,
  })
  @ApiResponse({
    status: 503,
    description:
      'Serviço indisponível - um ou mais serviços (Firebase, Mail ou Supabase) falharam na verificação',
    type: HealthErrorResponseDto,
  })
  check() {
    return this.health.check([
      () => this.firebase.isHealthy('firebase'),
      () => this.mail.isHealthy('mail'),
      () => this.prisma.isHealthy('supabase'),
    ]);
  }
}
