import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_SECRET') ?? 'secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    let user;
    try {
      user = await this.usersService.findOne(payload.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Usuário foi removido: qualquer token antigo deve ser inválido
        throw new UnauthorizedException('Conta não encontrada');
      }
      throw error;
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Conta desativada');
    }

    return {
      id: user.id,
      name: user.name ?? null,
      email: user.email,
      role: user.role,
    };
  }
}
