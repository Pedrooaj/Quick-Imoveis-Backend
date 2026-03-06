import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyService } from './property.service';

@ApiTags('Property')
@Controller('property')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CORRETOR)
@ApiBearerAuth()
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar imóvel',
    description:
      '**CORRETOR.** Exige e-mail verificado e CRECI no perfil. Endereço obrigatório. Status: RASCUNHO (rascunho), DISPONIVEL (publicado em /listings) ou VENDIDO. ' +
      'Se criado com status DISPONIVEL, compradores cujo perfil (localização e faixa de preço) se encaixa recebem e-mail de recomendação automaticamente.',
  })
  @ApiBody({ type: CreatePropertyDto })
  @ApiResponse({ status: 201, description: 'Imóvel criado com sucesso' })
  @ApiResponse({ status: 400, description: 'E-mail não verificado ou dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas corretores.' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertyService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar imóveis',
    description: '**CORRETOR.** Lista imóveis do corretor (inclui endereço e imagens com image_url). Ordenação por updated_at desc.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de imóveis com meta de paginação' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  findAll(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.propertyService.findAll(user.id, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar imóvel',
    description: '**CORRETOR.** Retorna detalhes do imóvel. Apenas se pertencer ao corretor autenticado.',
  })
  @ApiParam({ name: 'id', description: 'UUID do imóvel' })
  @ApiResponse({ status: 200, description: 'Imóvel encontrado (inclui endereço e imagens com image_url)' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.propertyService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar imóvel',
    description:
      '**CORRETOR.** Atualiza imóvel. Campos opcionais. status: DISPONIVEL = publicar em /listings; VENDIDO = marcar como vendido.',
  })
  @ApiParam({ name: 'id', description: 'UUID do imóvel' })
  @ApiBody({ type: UpdatePropertyDto })
  @ApiResponse({ status: 200, description: 'Imóvel atualizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertyService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover imóvel', description: '**CORRETOR.** Remove imóvel e dados relacionados (endereço, imagens do Firebase Storage).' })
  @ApiParam({ name: 'id', description: 'UUID do imóvel' })
  @ApiResponse({ status: 200, description: 'Imóvel removido', schema: { example: { message: 'Imóvel removido' } } })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.propertyService.remove(id, user.id);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'UUID do imóvel' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: { type: 'string', format: 'binary', description: 'Imagem (JPEG, PNG, WebP, GIF, máx. 5MB)' },
      },
    },
  })
  @ApiOperation({
    summary: 'Adicionar imagem',
    description: '**CORRETOR.** Upload máx. 5MB. Imagem principal = primeira por sort_order. Use PATCH images/reorder para alterar.',
  })
  @ApiResponse({ status: 201, description: 'Imagem adicionada' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou tipo não permitido' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  addImage(
    @CurrentUser() user: { id: string },
    @Param('id') propertyId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    return this.propertyService.addImage(propertyId, user.id, file);
  }

  @Patch(':id/images/reorder')
  @ApiOperation({
    summary: 'Reordenar imagens',
    description: '**CORRETOR.** Define ordem. Primeiro ID da lista = imagem principal exibida em /listings.',
  })
  @ApiParam({ name: 'id', description: 'UUID do imóvel' })
  @ApiBody({ type: ReorderImagesDto })
  @ApiResponse({ status: 200, description: 'Ordem atualizada', schema: { example: { message: 'Ordem das imagens atualizada' } } })
  @ApiResponse({ status: 400, description: 'IDs inválidos ou não pertencem ao imóvel' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  reorderImages(
    @CurrentUser() user: { id: string },
    @Param('id') propertyId: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.propertyService.reorderImages(
      propertyId,
      user.id,
      dto.image_ids,
    );
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Remover imagem', description: '**CORRETOR.** Remove imagem do imóvel e do Firebase Storage.' })
  @ApiParam({ name: 'id', description: 'UUID do imóvel' })
  @ApiParam({ name: 'imageId', description: 'UUID da imagem' })
  @ApiResponse({ status: 200, description: 'Imagem removida', schema: { example: { message: 'Imagem removida com sucesso' } } })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Imagem não encontrada' })
  removeImage(
    @CurrentUser() user: { id: string },
    @Param('id') propertyId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.propertyService.removeImage(propertyId, imageId, user.id);
  }
}
