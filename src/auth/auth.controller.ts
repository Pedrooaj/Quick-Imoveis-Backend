import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-in')
  @ApiOperation({
    summary: 'Login',
    description:
      '**Público.** Autentica com e-mail e senha. Retorna access_token e expires_in. Senha validada com bcrypt.',
  })
  @ApiBody({ type: SignInDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async signIn(@Body() dto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(dto.email, dto.password);
  }

  @Public()
  @Post('google')
  @ApiOperation({
    summary: 'Login com Google',
    description:
      '**Público.** Autentica com id_token ou access_token do Google. Valida JWT com chaves públicas do Google. Cria usuário se não existir (role COMPRADOR, e-mail verificado). Retorna access_token e expires_in.',
  })
  @ApiBody({ type: GoogleAuthDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'id_token ou access_token obrigatório' })
  @ApiResponse({ status: 401, description: 'Token do Google inválido ou expirado' })
  async signInWithGoogle(@Body() dto: GoogleAuthDto): Promise<AuthResponse> {
    return this.authService.signInWithGoogle(dto);
  }

  @Public()
  @Post('sign-up')
  @ApiOperation({
    summary: 'Cadastro',
    description:
      '**Público.** Cria conta (COMPRADOR ou CORRETOR). Senha hasheada com bcrypt. Retorna access_token e expires_in.',
  })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  async signUp(@Body() dto: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description:
      '**Autenticado.** O frontend deve descartar o access_token em memória/storage.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
    schema: { example: { message: 'Logout realizado com sucesso' } },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  logout(@CurrentUser() user: { id: string }) {
    return this.authService.logout(user.id);
  }

}
