import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PropertyStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { is_email_verified: true, creci: true },
    });

    if (!user?.is_email_verified) {
      throw new BadRequestException(
        'É necessário verificar seu e-mail para criar imóveis.',
      );
    }
    if (!user.creci?.trim()) {
      throw new BadRequestException(
        'CRECI é obrigatório para criar imóveis. Cadastre seu registro no perfil.',
      );
    }

    const property = await this.prisma.property.create({
      data: {
        owner_id: ownerId,
        title: dto.title,
        description: dto.description,
        property_type: dto.property_type,
        price: dto.price,
        area: dto.area ?? 0,
        bedrooms: dto.bedrooms ?? 0,
        status: dto.status ?? PropertyStatus.RASCUNHO,
        address: {
          create: {
            street: dto.address.street,
            number: dto.address.number,
            neighborhood: dto.address.neighborhood,
            city: dto.address.city,
            state: dto.address.state,
            country: dto.address.country,
            postal_code: dto.address.postal_code,
            lat: dto.address.lat,
            lng: dto.address.lng,
          },
        },
      },
      include: { address: true },
    });

    if (property.status === PropertyStatus.DISPONIVEL) {
      this.notifyMatchingBuyers(property).catch((err) =>
        this.logger.error('Falha ao notificar compradores', err),
      );
    }

    return property;
  }

  async findAll(ownerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where: { owner_id: ownerId },
        skip,
        take: limit,
        orderBy: { updated_at: 'desc' },
        include: {
          address: true,
          images: { orderBy: { sort_order: 'asc' } },
        },
      }),
      this.prisma.property.count({ where: { owner_id: ownerId } }),
    ]);

    return {
      data: data.map((p) => ({
        ...p,
        price: Number(p.price),
        area: Number(p.area),
        images: p.images.map((img) => ({
          id: img.id,
          filename: img.filename,
          content_type: img.content_type,
          size_bytes: img.size_bytes,
          width: img.width,
          height: img.height,
          sort_order: img.sort_order,
          created_at: img.created_at,
          image_url: img.image_url,
        })),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        address: true,
        images: { orderBy: { sort_order: 'asc' } },
      },
    });

    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    if (property.owner_id !== ownerId) {
      throw new ForbiddenException('Você não tem permissão para acessar este imóvel');
    }

    const images = property.images.map((img) => ({
      id: img.id,
      filename: img.filename,
      content_type: img.content_type,
      size_bytes: img.size_bytes,
      width: img.width,
      height: img.height,
      sort_order: img.sort_order,
      created_at: img.created_at,
      image_url: img.image_url,
    }));

    return {
      ...property,
      price: Number(property.price),
      area: Number(property.area),
      images,
    };
  }

  async addImage(
    propertyId: string,
    ownerId: string,
    file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    await this.assertOwnership(propertyId, ownerId);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo inválido. Use JPEG, PNG, WebP ou GIF.',
      );
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB para fotos de imóveis
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Arquivo muito grande. Máximo: 5MB.');
    }

    const maxOrder = await this.prisma.propertyImage.aggregate({
      where: { property_id: propertyId },
      _max: { sort_order: true },
    });
    const sortOrder = (maxOrder._max.sort_order ?? -1) + 1;

    const storagePath = this.firebaseService.propertyImagePath(propertyId, file.mimetype);
    const imageUrl = await this.firebaseService.uploadFile(
      storagePath,
      file.buffer,
      file.mimetype,
    );

    return this.prisma.propertyImage.create({
      data: {
        property: { connect: { id: propertyId } },
        image_url: imageUrl,
        storage_path: storagePath,
        content_type: file.mimetype,
        size_bytes: file.size,
        sort_order: sortOrder,
      },
    });
  }

  async reorderImages(
    propertyId: string,
    ownerId: string,
    imageIds: string[],
  ) {
    await this.assertOwnership(propertyId, ownerId);

    const images = await this.prisma.propertyImage.findMany({
      where: { property_id: propertyId },
      select: { id: true },
    });
    const validIds = new Set(images.map((i) => i.id));
    const invalidId = imageIds.find((id) => !validIds.has(id));
    if (invalidId || imageIds.length !== validIds.size) {
      throw new BadRequestException(
        'Lista de IDs inválida. Todos os IDs devem pertencer ao imóvel.',
      );
    }

    await this.prisma.$transaction(
      imageIds.map((id, index) =>
        this.prisma.propertyImage.update({
          where: { id },
          data: { sort_order: index },
        }),
      ),
    );

    return { message: 'Ordem das imagens atualizada' };
  }

  async removeImage(propertyId: string, imageId: string, ownerId: string) {
    await this.assertOwnership(propertyId, ownerId);

    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, property_id: propertyId },
    });

    if (!image) {
      throw new NotFoundException('Imagem não encontrada');
    }

    if (image.storage_path) {
      await this.firebaseService.deleteFile(image.storage_path);
    }

    await this.prisma.propertyImage.delete({
      where: { id: imageId },
    });

    return { message: 'Imagem removida com sucesso' };
  }

  async update(id: string, ownerId: string, dto: UpdatePropertyDto) {
    const current = await this.assertOwnership(id, ownerId);

    const addressData =
      dto.address !== undefined
        ? {
            street: dto.address.street,
            number: dto.address.number,
            neighborhood: dto.address.neighborhood,
            city: dto.address.city,
            state: dto.address.state,
            country: dto.address.country,
            postal_code: dto.address.postal_code,
            lat: dto.address.lat,
            lng: dto.address.lng,
          }
        : undefined;

    const updated = await this.prisma.property.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.property_type !== undefined && { property_type: dto.property_type }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.area !== undefined && { area: dto.area }),
        ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(addressData !== undefined && {
          address: {
            upsert: {
              create: addressData,
              update: addressData,
            },
          },
        }),
      },
      include: { address: true },
    });

    // Notificar compradores se o status mudou para DISPONIVEL
    const becameAvailable =
      dto.status === PropertyStatus.DISPONIVEL &&
      current.status !== PropertyStatus.DISPONIVEL;

    if (becameAvailable) {
      this.notifyMatchingBuyers(updated).catch((err) =>
        this.logger.error('Falha ao notificar compradores', err),
      );
    }

    return {
      ...updated,
      price: Number(updated.price),
      area: Number(updated.area),
    };
  }

  async remove(id: string, ownerId: string) {
    await this.assertOwnership(id, ownerId);

    // Deletar imagens do Firebase Storage antes de remover do banco
    const images = await this.prisma.propertyImage.findMany({
      where: { property_id: id },
      select: { storage_path: true },
    });
    const paths = images
      .map((img) => img.storage_path)
      .filter((p): p is string => !!p);
    if (paths.length > 0) {
      await this.firebaseService.deleteFiles(paths);
    }

    await this.prisma.property.delete({
      where: { id },
    });

    return { message: 'Imóvel removido com sucesso' };
  }

  /**
   * Busca compradores cujo perfil se encaixa no imóvel criado e envia e-mail de recomendação.
   * Critérios (mesmos de /listings/recommendations):
   * - Preço dentro da faixa calculada por renda_mensal/valor_entrada
   * - Mesmo estado ou mesma cidade do endereço do comprador
   */
  private async notifyMatchingBuyers(
    property: { id: string; title: string; price: Prisma.Decimal | number; address: { city?: string | null; state?: string | null; neighborhood?: string | null } | null },
  ) {
    const buyers = await this.prisma.user.findMany({
      where: {
        role: UserRole.COMPRADOR,
        is_active: true,
        address: { isNot: null },
      },
      include: { address: true },
    });

    const propertyPrice = Number(property.price);
    const propState = property.address?.state?.toLowerCase().trim() ?? '';
    const propCity = property.address?.city?.toLowerCase().trim() ?? '';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';

    const matched = buyers.filter((buyer) => {
      if (!buyer.address) return false;

      const buyerState = buyer.address.state?.toLowerCase().trim() ?? '';
      const buyerCity = buyer.address.city?.toLowerCase().trim() ?? '';
      const sameLocation =
        (propState && buyerState === propState) ||
        (propCity && buyerCity === propCity);
      if (!sameLocation) return false;

      const renda = buyer.renda_mensal != null ? Number(buyer.renda_mensal) : 0;
      const entrada = buyer.valor_entrada != null ? Number(buyer.valor_entrada) : 0;
      if (renda <= 0 && entrada <= 0) return true; // sem filtro financeiro = aceita qualquer preço

      const byEntrada = entrada > 0 ? entrada / 0.2 : Infinity;
      const byRenda = renda > 0 ? entrada + renda * 120 : Infinity;
      const maxPrice = Math.min(byEntrada, byRenda);

      return propertyPrice <= maxPrice;
    });

    if (matched.length === 0) return;

    const propertyUrl = `${frontendUrl}/imoveis/${property.id}`;
    const priceFormatted = propertyPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const location = [property.address?.neighborhood, property.address?.city, property.address?.state]
      .filter(Boolean)
      .join(', ');

    const promises = matched.map((buyer) =>
      this.mailService.sendMail({
        to: buyer.email,
        subject: `Novo imóvel recomendado para você: ${property.title}`,
        html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Quick Imóveis</h1>
        </td></tr>
        <!-- Badge -->
        <tr><td style="padding:28px 40px 0;text-align:center;">
          <span style="display:inline-block;background:#dbeafe;color:#1e40af;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding:6px 16px;border-radius:20px;">Nova Recomendação</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:20px 40px 0;">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:600;">Olá${buyer.name ? `, ${buyer.name}` : ''}!</h2>
          <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">Encontramos um imóvel que combina com o seu perfil:</p>
        </td></tr>
        <!-- Property Card -->
        <tr><td style="padding:0 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:24px;">
              <h3 style="margin:0 0 16px;color:#1e293b;font-size:18px;font-weight:600;">${property.title}</h3>
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:28px;">
                    <span style="font-size:16px;">💰</span>
                  </td>
                  <td style="padding:8px 0;">
                    <span style="color:#94a3b8;font-size:13px;">Preço</span><br>
                    <span style="color:#1e293b;font-size:16px;font-weight:700;">${priceFormatted}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;vertical-align:top;width:28px;">
                    <span style="font-size:16px;">📍</span>
                  </td>
                  <td style="padding:8px 0;">
                    <span style="color:#94a3b8;font-size:13px;">Localização</span><br>
                    <span style="color:#1e293b;font-size:15px;font-weight:500;">${location}</span>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <!-- CTA -->
        <tr><td style="padding:28px 40px;text-align:center;">
          <a href="${propertyUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1e40af);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;box-shadow:0 4px 12px rgba(37,99,235,0.3);">Ver detalhes do imóvel</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">Você recebeu este e-mail porque seu perfil indica interesse nesta região e faixa de preço.</p>
          <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Quick Imóveis. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
        `,
      }),
    );

    const results = await Promise.allSettled(promises);
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    this.logger.log(`Recomendação enviada: ${sent} e-mails (${failed} falhas) para imóvel ${property.id}`);
  }

  private async assertOwnership(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    if (property.owner_id !== ownerId) {
      throw new ForbiddenException(
        'Você não tem permissão para modificar este imóvel',
      );
    }

    return property;
  }
}
