import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // ─── Property Comments ───────────────────────────────────────

  @Get('property/:propertyId')
  @Public()
  @ApiOperation({
    summary: 'Listar comentários de um imóvel',
    description: '**Público.** Lista comentários de um imóvel com paginação.',
  })
  @ApiParam({ name: 'propertyId', description: 'UUID do imóvel' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de comentários com meta de paginação' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  findPropertyComments(
    @Param('propertyId') propertyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return this.commentsService.findPropertyComments(propertyId, p, l);
  }

  @Post('property/:propertyId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Comentar em um imóvel',
    description: '**Autenticado.** Adiciona comentário a um imóvel. Rating opcional (1-5).',
  })
  @ApiParam({ name: 'propertyId', description: 'UUID do imóvel' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Comentário criado' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  createPropertyComment(
    @CurrentUser() user: { id: string },
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createPropertyComment(user.id, propertyId, dto);
  }

  @Patch('property/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar comentário de imóvel',
    description: '**Autenticado.** Apenas o autor pode editar.',
  })
  @ApiParam({ name: 'id', description: 'UUID do comentário' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'Comentário atualizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado' })
  updatePropertyComment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updatePropertyComment(id, user.id, dto);
  }

  @Delete('property/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remover comentário de imóvel',
    description: '**Autenticado.** Apenas o autor pode remover.',
  })
  @ApiParam({ name: 'id', description: 'UUID do comentário' })
  @ApiResponse({ status: 200, description: 'Comentário removido' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado' })
  deletePropertyComment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.commentsService.deletePropertyComment(id, user.id);
  }

  // ─── Corretor Comments ──────────────────────────────────────

  @Get('corretor/:corretorId')
  @Public()
  @ApiOperation({
    summary: 'Listar comentários de um corretor',
    description: '**Público.** Lista comentários/avaliações de um corretor com paginação.',
  })
  @ApiParam({ name: 'corretorId', description: 'UUID do corretor' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de comentários com meta de paginação' })
  @ApiResponse({ status: 404, description: 'Corretor não encontrado' })
  findCorretorComments(
    @Param('corretorId') corretorId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return this.commentsService.findCorretorComments(corretorId, p, l);
  }

  @Post('corretor/:corretorId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Comentar sobre um corretor',
    description: '**Autenticado.** Adiciona comentário/avaliação a um corretor. Rating opcional (1-5).',
  })
  @ApiParam({ name: 'corretorId', description: 'UUID do corretor' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Comentário criado' })
  @ApiResponse({ status: 404, description: 'Corretor não encontrado' })
  createCorretorComment(
    @CurrentUser() user: { id: string },
    @Param('corretorId') corretorId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createCorretorComment(
      user.id,
      corretorId,
      dto,
    );
  }

  @Patch('corretor/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar comentário de corretor',
    description: '**Autenticado.** Apenas o autor pode editar.',
  })
  @ApiParam({ name: 'id', description: 'UUID do comentário' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'Comentário atualizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado' })
  updateCorretorComment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateCorretorComment(id, user.id, dto);
  }

  @Delete('corretor/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remover comentário de corretor',
    description: '**Autenticado.** Apenas o autor pode remover.',
  })
  @ApiParam({ name: 'id', description: 'UUID do comentário' })
  @ApiResponse({ status: 200, description: 'Comentário removido' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado' })
  deleteCorretorComment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.commentsService.deleteCorretorComment(id, user.id);
  }
}
