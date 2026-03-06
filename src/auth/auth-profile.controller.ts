import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthProfileController {
  constructor(private readonly authService: AuthService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Perfil',
    description:
      '**Autenticado.** Retorna dados do usuário: avatar (URL), endereço, renda_mensal, valor_entrada. Usado em recomendações.',
  })
  @ApiResponse({ status: 200, description: 'Dados do perfil', type: ProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  profile(@CurrentUser() user: { id: string }) {
    return this.authService.profile(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'João Silva',
          description: 'Nome do usuário',
        },
        creci: {
          type: 'string',
          example: '12345-F',
          description: 'CRECI (apenas CORRETOR)',
        },
        phone: {
          type: 'string',
          example: '11999998888',
          description: 'Telefone',
        },
        whatsapp: {
          type: 'string',
          example: '5511999998888',
          description: 'WhatsApp (com DDI)',
        },
        renda_mensal: {
          type: 'number',
          example: 5000,
          description: 'Renda mensal em reais (para recomendações)',
        },
        valor_entrada: {
          type: 'number',
          example: 50000,
          description:
            'Valor da entrada em reais (para recomendações)',
        },
        address: {
          type: 'object',
          description:
            'Endereço (usado para recomendações por proximidade)',
          properties: {
            street: { type: 'string', example: 'Rua das Flores' },
            number: { type: 'string', example: '123' },
            neighborhood: {
              type: 'string',
              example: 'Centro',
            },
            city: { type: 'string', example: 'São Paulo' },
            state: { type: 'string', example: 'São Paulo' },
            country: { type: 'string', example: 'Brasil' },
            postal_code: {
              type: 'string',
              example: '01310-100',
            },
            lat: { type: 'number', example: -23.5505 },
            lng: { type: 'number', example: -46.6333 },
          },
        },
        avatar: {
          type: 'string',
          format: 'binary',
          description:
            'Foto de perfil (JPEG, PNG, WebP, GIF, máx. 2MB)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Atualizar perfil',
    description:
      '**Autenticado.** Atualiza name, creci, phone, whatsapp, renda_mensal, valor_entrada, address, avatar. Multipart/form-data. Todos opcionais. CRECI obrigatório para criar imóveis.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
    @UploadedFile()
    avatar?: { buffer: Buffer; mimetype: string; size: number },
  ) {
    return this.authService.updateProfile(user.id, dto, avatar);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Desativar conta',
    description:
      '**Autenticado.** Desativa a conta do usuário (is_active = false). Qualquer token existente passa a retornar 401 nas próximas requisições.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conta desativada com sucesso',
    schema: { example: { message: 'Conta desativada com sucesso' } },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  deactivateAccount(@CurrentUser() user: { id: string }) {
    return this.authService.deactivateAccount(user.id);
  }
}

