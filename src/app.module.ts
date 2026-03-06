import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PropertyModule } from './property/property.module';
import { ListingsModule } from './listings/listings.module';
import { FavoriteModule } from './favorite/favorite.module';
import { CorretoresModule } from './corretores/corretores.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    FirebaseModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    HealthModule,
    MailModule,
    PropertyModule,
    ListingsModule,
    FavoriteModule,
    CorretoresModule,
    CommentsModule,
  ],

  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
