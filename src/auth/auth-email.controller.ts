import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthEmailController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-email-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Solicitar verificação de e-mail',
    description:
      '**Autenticado.** Envia link por e-mail. Link válido 5 min. Corretor precisa verificar para criar imóveis.',
  })
  @ApiResponse({
    status: 200,
    description: 'Código enviado com sucesso',
    schema: { example: { message: 'Código enviado por e-mail' } },
  })
  @ApiResponse({ status: 400, description: 'E-mail já verificado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  requestEmailVerification(@CurrentUser() user: { id: string }) {
    return this.authService.requestEmailVerification(user.id);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({
    summary: 'Verificar e-mail',
    description:
      '**Público.** Valida token do link enviado por e-mail. Marca conta como verificada.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'E-mail verificado com sucesso',
    schema: { example: { message: 'E-mail verificado com sucesso' } },
  })
  @ApiResponse({ status: 401, description: 'Link inválido ou expirado' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }
}

