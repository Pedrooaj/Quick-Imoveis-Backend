import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { FirebaseService } from '../firebase/firebase.service';
import {
  BCRYPT_SALT_ROUNDS,
  EMAIL_VERIFICATION_CODE_EXPIRATION_MINUTES,
  PASSWORD_RESET_CODE_EXPIRATION_MINUTES,
  PASSWORD_RESET_CODE_MAX,
  PASSWORD_RESET_CODE_MIN,
} from './constants';
import { SignUpDto } from './dto/sign-up.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    is_active: boolean;
    is_email_verified: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly firebaseService: FirebaseService,
  ) {}

  private buildUserResponse(user: {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    is_active: boolean;
    is_email_verified: boolean;
  }) {
    return {
      id: user.id,
      name: user.name ?? null,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      is_email_verified: user.is_email_verified,
    };
  }

  /**
   * Gera access_token JWT.
   */
  async issueToken(user: {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
    is_active: boolean;
    is_email_verified: boolean;
  }): Promise<AuthResponse> {
    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const decoded = this.jwtService.decode(access_token) as { exp?: number };
    const expires_in = decoded?.exp
      ? Math.max(0, Math.floor(decoded.exp - Date.now() / 1000))
      : 900;

    return {
      access_token,
      expires_in,
      user: this.buildUserResponse(user),
    };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email.toLowerCase());

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Conta desativada');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    await this.usersService.updateUser({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    return this.issueToken({
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
      is_active: user.is_active,
      is_email_verified: user.is_email_verified,
    });
  }

  async signInWithGoogle(dto: {
    id_token?: string;
    access_token?: string;
    role?: UserRole;
  }): Promise<AuthResponse> {
    if (!dto.id_token && !dto.access_token) {
      throw new BadRequestException(
        'Informe id_token ou access_token do Google',
      );
    }

    let email: string;
    let name: string | null = null;

    if (dto.id_token) {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (!clientId) {
        throw new BadRequestException(
          'GOOGLE_CLIENT_ID não configurado no servidor',
        );
      }
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: dto.id_token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw new UnauthorizedException('Token do Google inválido ou expirado');
      }
      email = payload.email;
      name = payload.name ?? null;
    } else if (dto.access_token) {
      try {
        const { data } = await axios.get<{ email?: string; name?: string }>(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: { Authorization: `Bearer ${dto.access_token}` },
          },
        );
        if (!data?.email) {
          throw new UnauthorizedException(
            'Token do Google inválido ou expirado',
          );
        }
        email = data.email;
        name = data.name ?? null;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          throw new UnauthorizedException('Token do Google inválido ou expirado');
        }
        throw err;
      }
    } else {
      throw new BadRequestException(
        'Informe id_token ou access_token do Google',
      );
    }

    let user = await this.usersService.findByEmail(email.toLowerCase());

    if (!user) {
      try {
        user = await this.usersService.createUserFromGoogle({
          email: email.toLowerCase(),
          name,
          role: dto.role,
        });
      } catch (err) {
        if (err instanceof ConflictException) {
          user = await this.usersService.findByEmail(email.toLowerCase());
          if (!user) throw err;
        } else {
          throw err;
        }
      }
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Conta desativada');
    }

    await this.usersService.updateUser({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    return this.issueToken({
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
      is_active: user.is_active,
      is_email_verified: user.is_email_verified,
    });
  }

  async signUp(dto: SignUpDto): Promise<AuthResponse> {
    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: dto.role,
      creci: dto.creci,
      phone: dto.phone,
      whatsapp: dto.whatsapp,
    });

    return this.issueToken({
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
      is_active: user.is_active,
      is_email_verified: user.is_email_verified,
    });
  }

  async profile(userId: string) {
    const user = await this.usersService.findOneWithAddress(userId);

    const avatar = user.avatar_url ?? null;

    const needs_role = !user.role;

    return {
      id: user.id,
      name: user.name ?? null,
      email: user.email,
      role: user.role,
      creci: user.creci ?? null,
      phone: user.phone ?? null,
      whatsapp: user.whatsapp ?? null,
      is_active: user.is_active,
      is_email_verified: user.is_email_verified,
      avatar,
      renda_mensal: user.renda_mensal ? Number(user.renda_mensal) : null,
      valor_entrada: user.valor_entrada ? Number(user.valor_entrada) : null,
      created_at: user.created_at,
      last_login: user.last_login,
      needs_role,
      address: user.address
        ? {
            street: user.address.street,
            number: user.address.number,
            neighborhood: user.address.neighborhood,
            city: user.address.city,
            state: user.address.state,
            country: user.address.country,
            postal_code: user.address.postal_code,
            lat: user.address.lat,
            lng: user.address.lng,
          }
        : null,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: { buffer: Buffer; mimetype: string; size: number },
  ) {
    const data: Prisma.UserUpdateInput = {};

    if (dto.role !== undefined) {
      // Só permite definir o role se ainda não existir (primeira vez)
      const user = await this.usersService.findOne(userId);
      if (user.role) {
        throw new BadRequestException(
          'Tipo de conta já definido. Não é possível alterar o role.',
        );
      }
      data.role = dto.role;
    }

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.creci !== undefined) data.creci = dto.creci;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp;
    if (dto.renda_mensal !== undefined) data.renda_mensal = dto.renda_mensal;
    if (dto.valor_entrada !== undefined) data.valor_entrada = dto.valor_entrada;

    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Tipo de arquivo inválido. Use JPEG, PNG, WebP ou GIF.',
        );
      }
      const MAX_SIZE = 2 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        throw new BadRequestException('Arquivo muito grande. Máximo: 2MB.');
      }
      const storagePath = this.firebaseService.avatarPath(userId, file.mimetype);
      const avatarUrl = await this.firebaseService.uploadFile(
        storagePath,
        file.buffer,
        file.mimetype,
      );
      data.avatar_url = avatarUrl;
    }

    if (dto.address !== undefined) {
      const addressData = {
        street: dto.address.street,
        number: dto.address.number,
        neighborhood: dto.address.neighborhood,
        city: dto.address.city,
        state: dto.address.state,
        country: dto.address.country,
        postal_code: dto.address.postal_code,
        lat: dto.address.lat,
        lng: dto.address.lng,
      };
      data.address = {
        upsert: {
          create: addressData,
          update: addressData,
        },
      };
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Nenhum campo para atualizar');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.profile(userId);
  }

  async deactivateAccount(userId: string): Promise<{ message: string }> {
    await this.usersService.updateUser({
      where: { id: userId },
      data: { is_active: false },
    });

    await this.prisma.passwordReset.deleteMany({
      where: { user_id: userId },
    });

    await this.prisma.emailVerification.deleteMany({
      where: { user_id: userId },
    });

    return { message: 'Conta desativada com sucesso' };
  }

  async logout(_userId: string): Promise<{ message: string }> {
    return { message: 'Logout realizado com sucesso' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email.toLowerCase());

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!user.is_active) {
      throw new BadRequestException('Conta desativada');
    }

    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + PASSWORD_RESET_CODE_EXPIRATION_MINUTES,
    );

    await this.prisma.passwordReset.deleteMany({
      where: { user_id: user.id },
    });

    await this.prisma.passwordReset.create({
      data: {
        user_id: user.id,
        code,
        expires_at: expiresAt,
      },
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Recuperação de senha - Quick Imóveis',
      text: `Seu código de recuperação de senha é: ${code}. Este código expira em ${PASSWORD_RESET_CODE_EXPIRATION_MINUTES} minutos.`,
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
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:600;">Recuperação de senha</h2>
          <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">Você solicitou a recuperação de senha. Use o código abaixo para redefinir sua senha:</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <div style="background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:10px;padding:20px 32px;display:inline-block;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1e293b;font-family:'Courier New',monospace;">${code}</span>
            </div>
          </td></tr></table>
          <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">⏱ Este código expira em <strong>${PASSWORD_RESET_CODE_EXPIRATION_MINUTES} minutos</strong>.</p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Se você não solicitou esta alteração, ignore este e-mail.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Quick Imóveis. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    return {
      message: 'Código de recuperação enviado para o e-mail informado',
    };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email.toLowerCase());

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const reset = await this.prisma.passwordReset.findFirst({
      where: {
        user_id: user.id,
        code,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!reset) {
      throw new UnauthorizedException('Código inválido');
    }

    if (new Date() > reset.expires_at) {
      await this.prisma.passwordReset.delete({ where: { id: reset.id } });
      throw new UnauthorizedException('Código expirado. Solicite um novo código.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordReset.deleteMany({
        where: { user_id: user.id },
      }),
    ]);

    return {
      message: 'Senha alterada com sucesso',
    };
  }

  async requestEmailVerification(userId: string): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);

    if (user.is_email_verified) {
      throw new BadRequestException('E-mail já verificado');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + EMAIL_VERIFICATION_CODE_EXPIRATION_MINUTES,
    );

    await this.prisma.emailVerification.deleteMany({
      where: { user_id: user.id },
    });

    await this.prisma.emailVerification.create({
      data: {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      },
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      'http://localhost:3001';
    const verifyLink = `${frontendUrl}/verify-email?token=${token}`;

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Verificação de e-mail - Quick Imóveis',
      text: `Clique no link para verificar seu e-mail: ${verifyLink}. Este link expira em ${EMAIL_VERIFICATION_CODE_EXPIRATION_MINUTES} minutos.`,
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
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:600;">Verifique seu e-mail</h2>
          <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.6;">Para garantir a segurança da sua conta, confirme seu endereço de e-mail clicando no botão abaixo:</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${verifyLink}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1e40af);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:8px;box-shadow:0 4px 12px rgba(37,99,235,0.3);">Verificar e-mail</a>
          </td></tr></table>
          <p style="margin:28px 0 4px;color:#94a3b8;font-size:13px;">Ou copie e cole este link no navegador:</p>
          <p style="margin:0 0 24px;color:#64748b;font-size:12px;word-break:break-all;background:#f1f5f9;padding:12px;border-radius:6px;">${verifyLink}</p>
          <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">⏱ Este link expira em <strong>${EMAIL_VERIFICATION_CODE_EXPIRATION_MINUTES} minutos</strong>.</p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Se você não solicitou esta verificação, ignore este e-mail.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} Quick Imóveis. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    return {
      message: 'Link de verificação enviado para o e-mail',
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new UnauthorizedException('Link inválido');
    }

    if (verification.user.is_email_verified) {
      await this.prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      throw new BadRequestException('E-mail já verificado');
    }

    if (new Date() > verification.expires_at) {
      await this.prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      throw new UnauthorizedException('Link expirado. Solicite um novo link.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.user_id },
        data: { is_email_verified: true },
      }),
      this.prisma.emailVerification.deleteMany({
        where: { user_id: verification.user_id },
      }),
    ]);

    return {
      message: 'E-mail verificado com sucesso',
    };
  }

  private generateCode(): string {
    return Math.floor(
      PASSWORD_RESET_CODE_MIN +
        Math.random() * (PASSWORD_RESET_CODE_MAX - PASSWORD_RESET_CODE_MIN + 1),
    ).toString();
  }
}
