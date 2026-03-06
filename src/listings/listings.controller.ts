import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ListingsService } from './listings.service';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recomendações personalizadas',
    description:
      '**Autenticado.** Imóveis DISPONIVEL ordenados por proximidade e faixa de preço.\n\n' +
      '**Requisitos:** endereço no perfil + (state OU city OU renda_mensal OU valor_entrada).\n\n' +
      '**Cálculo preço máx:** min(valor_entrada/0.2, valor_entrada + renda_mensal×120). Entrada = 20% do valor; renda = parcelas em 120 meses.\n\n' +
      '**Ordenação:** 1) mesmo estado, 2) mesma cidade, 3) updated_at desc.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de imóveis recomendados com data e meta' })
  @ApiResponse({ status: 400, description: 'Perfil incompleto: cadastre endereço e/ou renda e valor de entrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findRecommendations(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.listingsService.findRecommendations(user.id, pageNum, limitNum);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar todos os imóveis',
    description:
      '**Público.** Sem token. Lista imóveis com filtros opcionais. Ordenação: updated_at desc.\n\n' +
      '**Status padrão:** DISPONIVEL. Use status=DISPONIVEL,VENDIDO para incluir vendidos.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiQuery({ name: 'min_price', required: false, description: 'Preço mínimo em reais' })
  @ApiQuery({ name: 'max_price', required: false, description: 'Preço máximo em reais' })
  @ApiQuery({ name: 'city', required: false, description: 'Cidade (contains, case insensitive)' })
  @ApiQuery({ name: 'neighborhood', required: false, description: 'Bairro (contains, case insensitive)' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'DISPONIVEL, VENDIDO ou DISPONIVEL,VENDIDO. Padrão: DISPONIVEL',
  })
  @ApiResponse({ status: 200, description: '{ data: [...], meta: { total, page, limit, totalPages } }' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('min_price') min_price?: string,
    @Query('max_price') max_price?: string,
    @Query('city') city?: string,
    @Query('neighborhood') neighborhood?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const minPrice = min_price != null ? parseFloat(min_price) : undefined;
    const maxPrice = max_price != null ? parseFloat(max_price) : undefined;
    const statuses = status
      ? (status.split(',').map((s) => s.trim().toUpperCase()) as PropertyStatus[]).filter((s) =>
          ['DISPONIVEL', 'VENDIDO'].includes(s),
        )
      : undefined;

    return this.listingsService.findAll({
      page: pageNum,
      limit: limitNum,
      min_price: minPrice,
      max_price: maxPrice,
      city,
      neighborhood,
      status: statuses?.length ? statuses : undefined,
    });
  }

  @Get('owner/:ownerId')
  @Public()
  @ApiOperation({
    summary: 'Listar imóveis de um corretor',
    description:
      '**Público.** Retorna imóveis de um corretor específico (portfolio). Por padrão inclui imóveis DISPONIVEL e VENDIDO, nunca RASCUNHO.',
  })
  @ApiParam({ name: 'ownerId', description: 'UUID do corretor (users.id)' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'DISPONIVEL, VENDIDO ou DISPONIVEL,VENDIDO. Padrão: ambos (DISPONIVEL e VENDIDO).',
  })
  @ApiResponse({
    status: 200,
    description:
      '{ data: [...], meta: { total, page, limit, totalPages } } – mesmo formato de GET /listings',
  })
  findByOwner(
    @Param('ownerId') ownerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const statuses = status
      ? (status.split(',').map((s) => s.trim().toUpperCase()) as PropertyStatus[]).filter(
          (s) => ['DISPONIVEL', 'VENDIDO'].includes(s),
        )
      : undefined;

    return this.listingsService.findByOwner({
      ownerId,
      page: pageNum,
      limit: limitNum,
      status: statuses?.length ? statuses : undefined,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Detalhe do imóvel',
    description:
      '**Público.** Retorna detalhes do imóvel. Aceita status DISPONIVEL ou VENDIDO. Inclui endereço, imagens (image_url), dados do corretor.',
  })
  @ApiParam({ name: 'id', description: 'UUID do imóvel' })
  @ApiResponse({ status: 200, description: 'Imóvel encontrado' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado ou status RASCUNHO' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }
}
