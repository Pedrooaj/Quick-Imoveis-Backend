import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { AuthController } from './auth.controller';
import { AuthEmailController } from './auth-email.controller';
import { AuthPasswordController } from './auth-password.controller';
import { AuthProfileController } from './auth-profile.controller';
import { AuthService } from './auth.service';
import { JWT_EXPIRATION_DEFAULT } from './constants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    PrismaModule,
    MailModule,
    FirebaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const expiresIn =
          config.get<string>('JWT_EXPIRATION') ?? JWT_EXPIRATION_DEFAULT;
        return {
          secret:
            config.get<string>('JWT_SECRET') ??
            'secret-key-change-in-production',
          signOptions: { expiresIn } as SignOptions,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [
    AuthController,
    AuthPasswordController,
    AuthEmailController,
    AuthProfileController,
  ],
  exports: [AuthService],
})
export class AuthModule {}
