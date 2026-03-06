import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Property Comments ───────────────────────────────────────

  async createPropertyComment(
    authorId: string,
    propertyId: string,
    dto: CreateCommentDto,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Imóvel não encontrado');

    return this.prisma.propertyComment.create({
      data: {
        author_id: authorId,
        property_id: propertyId,
        content: dto.content,
        rating: dto.rating,
      },
      include: { author: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  async findPropertyComments(
    propertyId: string,
    page: number,
    limit: number,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) throw new NotFoundException('Imóvel não encontrado');

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.propertyComment.findMany({
        where: { property_id: propertyId },
        include: { author: { select: { id: true, name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.propertyComment.count({ where: { property_id: propertyId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Corretor Comments ──────────────────────────────────────

  async createCorretorComment(
    authorId: string,
    corretorId: string,
    dto: CreateCommentDto,
  ) {
    const corretor = await this.prisma.user.findUnique({
      where: { id: corretorId },
    });
    if (!corretor || corretor.role !== 'CORRETOR')
      throw new NotFoundException('Corretor não encontrado');

    return this.prisma.corretorComment.create({
      data: {
        author_id: authorId,
        corretor_id: corretorId,
        content: dto.content,
        rating: dto.rating,
      },
      include: { author: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  async findCorretorComments(
    corretorId: string,
    page: number,
    limit: number,
  ) {
    const corretor = await this.prisma.user.findUnique({
      where: { id: corretorId },
    });
    if (!corretor || corretor.role !== 'CORRETOR')
      throw new NotFoundException('Corretor não encontrado');

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.corretorComment.findMany({
        where: { corretor_id: corretorId },
        include: { author: { select: { id: true, name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.corretorComment.count({ where: { corretor_id: corretorId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Shared (update / delete) ───────────────────────────────

  async updatePropertyComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.propertyComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.author_id !== userId)
      throw new ForbiddenException('Sem permissão para editar este comentário');

    return this.prisma.propertyComment.update({
      where: { id: commentId },
      data: { content: dto.content, rating: dto.rating },
      include: { author: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  async deletePropertyComment(commentId: string, userId: string) {
    const comment = await this.prisma.propertyComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.author_id !== userId)
      throw new ForbiddenException('Sem permissão para remover este comentário');

    await this.prisma.propertyComment.delete({ where: { id: commentId } });
    return { message: 'Comentário removido' };
  }

  async updateCorretorComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.corretorComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.author_id !== userId)
      throw new ForbiddenException('Sem permissão para editar este comentário');

    return this.prisma.corretorComment.update({
      where: { id: commentId },
      data: { content: dto.content, rating: dto.rating },
      include: { author: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  async deleteCorretorComment(commentId: string, userId: string) {
    const comment = await this.prisma.corretorComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.author_id !== userId)
      throw new ForbiddenException('Sem permissão para remover este comentário');

    await this.prisma.corretorComment.delete({ where: { id: commentId } });
    return { message: 'Comentário removido' };
  }
}
