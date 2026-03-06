import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient, PropertyStatus } from '@prisma/client';

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  private asPrismaClient(): PrismaClient {
    // PrismaService estende PrismaClient; este cast permite acessar delegates fortemente tipados.
    return this.prisma as unknown as PrismaClient;
  }

  private mapProperty(p: {
    id: string;
    title: string;
    description: string | null;
    property_type: string | null;
    price: unknown;
    area: unknown;
    bedrooms: number;
    status: string;
    created_at: Date;
    address: unknown;
    images: Array<{
      id: string;
      content_type: string | null;
      sort_order: number;
      image_url: string;
    }>;
    owner: {
      id: string;
      name: string | null;
      email: string;
      creci: string | null;
      phone: string | null;
      whatsapp: string | null;
    };
  }) {
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      property_type: p.property_type,
      price: Number(p.price),
      area: Number(p.area),
      bedrooms: p.bedrooms,
      status: p.status,
      created_at: p.created_at,
      address: p.address,
      images: p.images.map((img) => ({
        id: img.id,
        content_type: img.content_type,
        sort_order: img.sort_order,
        image_url: img.image_url,
      })),
      owner: p.owner,
    };
  }

  async listFavorites(userId: string, page = 1, limit = 10) {
    const prisma = this.asPrismaClient();
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { user_id: userId },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          property: {
            include: {
              address: true,
              images: { orderBy: { sort_order: 'asc' } },
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  creci: true,
                  phone: true,
                  whatsapp: true,
                },
              },
            },
          },
        },
      }),
      prisma.favorite.count({ where: { user_id: userId } }),
    ]);

    return {
      data: rows
        .filter((f) => f.property)
        .map((f) =>
          this.mapProperty(
            f.property as unknown as {
              id: string;
              title: string;
              description: string | null;
              property_type: string | null;
              price: unknown;
              area: unknown;
              bedrooms: number;
              status: string;
              created_at: Date;
              address: unknown;
              images: Array<{
                id: string;
                content_type: string | null;
                sort_order: number;
                image_url: string;
              }>;
              owner: {
                id: string;
                name: string | null;
                email: string;
                creci: string | null;
                phone: string | null;
                whatsapp: string | null;
              };
            },
          ),
        ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addFavorite(userId: string, listingId: string) {
    const prisma = this.asPrismaClient();

    const property = await prisma.property.findUnique({
      where: { id: listingId },
      include: {
        address: true,
        images: { orderBy: { sort_order: 'asc' } },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            creci: true,
            phone: true,
            whatsapp: true,
          },
        },
      },
    });

    if (
      !property ||
      (property.status !== PropertyStatus.DISPONIVEL && property.status !== PropertyStatus.VENDIDO)
    ) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    await prisma.favorite.upsert({
      where: {
        user_id_listing_id: {
          user_id: userId,
          listing_id: listingId,
        },
      },
      create: {
        user_id: userId,
        listing_id: listingId,
      },
      update: {},
    });

    return this.mapProperty(property as any);
  }

  async removeFavorite(userId: string, listingId: string) {
    const prisma = this.asPrismaClient();

    try {
      await prisma.favorite.delete({
        where: {
          user_id_listing_id: {
            user_id: userId,
            listing_id: listingId,
          },
        },
      });
    } catch {
      // Se já não existir, tratamos como idempotente (nada a remover).
    }

    return { message: 'Favorito removido (se existia).' };
  }
}
