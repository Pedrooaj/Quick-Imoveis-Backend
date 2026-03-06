import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthPasswordController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Esqueci a senha',
    description: '**Público.** Envia código de 6 dígitos por e-mail. Válido por 5 minutos. Use em reset-password.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Código enviado com sucesso',
    schema: { example: { message: 'Código enviado por e-mail' } },
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Redefinir senha',
    description:
      '**Público.** Valida código do forgot-password e define nova senha. Código expira em 5 minutos.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
    schema: { example: { message: 'Senha alterada com sucesso' } },
  })
  @ApiResponse({ status: 401, description: 'Código inválido ou expirado' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }
}

