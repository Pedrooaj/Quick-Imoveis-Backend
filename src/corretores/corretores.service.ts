import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CorretorRow {
  id: string;
  name: string | null;
  email: string;
  creci: string | null;
  phone: string | null;
  whatsapp: string | null;
  favoritesCount: number;
}

@Injectable()
export class CorretoresService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista corretores ordenados pela quantidade de favoritos nos seus imóveis.
   * Permite busca por nome ou CRECI (ILIKE).
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = params.search?.trim();

    if (search) {
      return this.findAllWithSearch(search, page, limit, skip);
    }
    return this.findAllNoSearch(page, limit, skip);
  }

  private async findAllNoSearch(
    page: number,
    limit: number,
    skip: number,
  ) {
    const rows = await this.prisma.$queryRaw<CorretorRow[]>`
      SELECT
        u.id,
        u.name,
        u.email,
        u.creci,
        u.phone,
        u.whatsapp,
        COUNT(f.id)::int AS "favoritesCount"
      FROM users u
      LEFT JOIN properties p ON p.owner_id = u.id
      LEFT JOIN favorites f ON f.listing_id = p.id
      WHERE u.role = ${UserRole.CORRETOR} AND u.is_active = true
      GROUP BY u.id, u.name, u.email, u.creci, u.phone, u.whatsapp
      ORDER BY "favoritesCount" DESC, u.name ASC NULLS LAST
      LIMIT ${limit} OFFSET ${skip}
    `;

    const [{ total }] = await this.prisma.$queryRaw<[{ total: bigint }]>`
      SELECT COUNT(*)::int AS total
      FROM users u
      WHERE u.role = ${UserRole.CORRETOR} AND u.is_active = true
    `;

    const totalNum = Number(total);
    return {
      data: rows,
      meta: {
        total: totalNum,
        page,
        limit,
        totalPages: Math.ceil(totalNum / limit),
      },
    };
  }

  private async findAllWithSearch(
    search: string,
    page: number,
    limit: number,
    skip: number,
  ) {
    const pattern = `%${search}%`;
    const rows = await this.prisma.$queryRaw<CorretorRow[]>`
      SELECT
        u.id,
        u.name,
        u.email,
        u.creci,
        u.phone,
        u.whatsapp,
        COUNT(f.id)::int AS "favoritesCount"
      FROM users u
      LEFT JOIN properties p ON p.owner_id = u.id
      LEFT JOIN favorites f ON f.listing_id = p.id
      WHERE u.role = ${UserRole.CORRETOR}
        AND u.is_active = true
        AND (u.name ILIKE ${pattern} OR u.creci ILIKE ${pattern})
      GROUP BY u.id, u.name, u.email, u.creci, u.phone, u.whatsapp
      ORDER BY "favoritesCount" DESC, u.name ASC NULLS LAST
      LIMIT ${limit} OFFSET ${skip}
    `;

    const [{ total }] = await this.prisma.$queryRaw<[{ total: bigint }]>`
      SELECT COUNT(*)::int AS total
      FROM users u
      WHERE u.role = ${UserRole.CORRETOR}
        AND u.is_active = true
        AND (u.name ILIKE ${pattern} OR u.creci ILIKE ${pattern})
    `;

    const totalNum = Number(total);
    return {
      data: rows,
      meta: {
        total: totalNum,
        page,
        limit,
        totalPages: Math.ceil(totalNum / limit),
      },
    };
  }
}
