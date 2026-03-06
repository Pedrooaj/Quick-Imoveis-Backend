import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CorretoresService } from './corretores.service';

@ApiTags('Corretores')
@Controller('corretores')
export class CorretoresController {
  constructor(private readonly corretoresService: CorretoresService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar corretores',
    description:
      '**Público.** Lista corretores ordenados pela quantidade de favoritos nos imóveis (quem mais tem imóveis favoritados primeiro). Permite buscar por nome ou CRECI.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Busca por nome do corretor ou CRECI (case insensitive)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({
    status: 200,
    description:
      '{ data: [{ id, name, email, creci, phone, whatsapp, favoritesCount }], meta: { total, page, limit, totalPages } }',
  })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.corretoresService.findAll({
      search: search?.trim() || undefined,
      page: pageNum,
      limit: limitNum,
    });
  }
}
