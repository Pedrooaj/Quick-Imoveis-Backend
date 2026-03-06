import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Favorite')
@Controller('favorite')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar imóveis favoritos',
    description:
      '**Autenticado.** Retorna imóveis marcados como favoritos pelo usuário atual, com paginação e mesmo formato de resposta de listings.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({
    status: 200,
    description: '{ data: [...properties], meta: { total, page, limit, totalPages } }',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  listFavorites(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.favoriteService.listFavorites(user.id, pageNum, limitNum);
  }

  @Post(':listingId')
  @ApiOperation({
    summary: 'Adicionar imóvel aos favoritos',
    description:
      '**Autenticado.** Marca um imóvel como favorito para o usuário atual. Idempotente: se já for favorito, apenas retorna o imóvel.',
  })
  @ApiParam({ name: 'listingId', description: 'UUID do imóvel (properties.id)' })
  @ApiResponse({ status: 200, description: 'Imóvel favorito retornado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado ou não disponível/vendido' })
  addFavorite(@CurrentUser() user: { id: string }, @Param('listingId') listingId: string) {
    return this.favoriteService.addFavorite(user.id, listingId);
  }

  @Delete(':listingId')
  @ApiOperation({
    summary: 'Remover imóvel dos favoritos',
    description:
      '**Autenticado.** Remove um imóvel dos favoritos do usuário atual. Idempotente: se não estava favorito, responde sucesso mesmo assim.',
  })
  @ApiParam({ name: 'listingId', description: 'UUID do imóvel (properties.id)' })
  @ApiResponse({ status: 200, description: 'Favorito removido (se existia)' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  removeFavorite(@CurrentUser() user: { id: string }, @Param('listingId') listingId: string) {
    return this.favoriteService.removeFavorite(user.id, listingId);
  }
}
