import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca um usuário por critério único. Retorna null se não encontrado.
   * @see https://docs.nestjs.com/recipes/prisma
   */
  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  /**
   * Lista usuários com paginação, filtros e ordenação.
   * @see https://docs.nestjs.com/recipes/prisma
   */
  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  /**
   * Cria um novo usuário com senha hasheada.
   */
  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const email = (data.email as string).toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const hashedPassword = await bcrypt.hash(
      data.password as string,
      this.SALT_ROUNDS,
    );

    return this.prisma.user.create({
      data: {
        ...data,
        email,
        password: hashedPassword,
      },
    });
  }

  /**
   * Atualiza um usuário existente.
   * @see https://docs.nestjs.com/recipes/prisma
   */
  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;

    if (data.email) {
      const email = (data.email as string).toLowerCase();
      const id = 'id' in where ? where.id : undefined;
      const existing = await this.prisma.user.findFirst({
        where: { email, ...(id && { NOT: { id } }) },
      });
      if (existing) {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
      data.email = email;
    }

    if (data.password) {
      data.password = await bcrypt.hash(
        data.password as string,
        this.SALT_ROUNDS,
      );
    }

    return this.prisma.user.update({ data, where });
  }

  /**
   * Remove um usuário. Retorna o registro deletado.
   * @see https://docs.nestjs.com/recipes/prisma
   */
  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({ where });
  }

  // --- Métodos de conveniência (camada de aplicação) ---

  /**
   * Busca um usuário por ID. Lança NotFoundException se não existir.
   */
  async findOne(id: string): Promise<User> {
    const user = await this.user({ id });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  /**
   * Busca usuário por ID com endereço (para perfil).
   */
  async findOneWithAddress(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { address: true },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  /**
   * Busca usuário por e-mail.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.user({ email: email.toLowerCase() });
  }

  /**
   * Cria usuário vindos de OAuth Google (senha placeholder, nunca usada para login).
   */
  async createUserFromGoogle(data: {
    email: string;
    name?: string | null;
    role?: UserRole;
  }): Promise<User> {
    const email = data.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }
    const placeholderPassword = await bcrypt.hash(
      `google-oauth-${randomBytes(32).toString('hex')}`,
      this.SALT_ROUNDS,
    );
    return this.prisma.user.create({
      data: {
        email,
        name: data.name ?? null,
        password: placeholderPassword,
        role: data.role,
        is_email_verified: true,
      },
    });
  }

  /**
   * Cria usuário a partir do DTO (validação + transformação).
   */
  async create(dto: CreateUserDto): Promise<User> {
    return this.createUser({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: dto.role,
      creci: dto.creci,
      phone: dto.phone,
      whatsapp: dto.whatsapp,
      is_active: dto.is_active,
      is_email_verified: dto.is_email_verified,
      renda_mensal: dto.renda_mensal,
      valor_entrada: dto.valor_entrada,
    });
  }

  /**
   * Remove usuário por ID.
   */
  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.deleteUser({ id });
  }
}
