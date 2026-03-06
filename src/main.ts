import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [process.env.CORS_ORIGIN],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Quick Imóveis API')
    .setDescription(
      'API para plataforma de imóveis com **compradores** e **corretores**.\n\n' +
        '## Regras de acesso\n\n' +
        '- **Rotas públicas**: não exigem token (sign-in, sign-up, forgot/reset password, verify-email, GET /listings, GET /listings/:id, GET /health)\n' +
        '- **Rotas autenticadas**: exigem `Authorization: Bearer <token>`\n' +
        '- **Property**: apenas usuários com role **CORRETOR**\n' +
        '- **Listings/recommendations**: autenticado + perfil com endereço e/ou renda/entrada\n\n' +
        '## Módulos\n\n' +
        '- **Auth**: Login, cadastro, recuperação de senha (código 6 dígitos, 5 min), verificação de e-mail (link 5 min), perfil. JWT expira em 15 minutos (configurável via JWT_EXPIRATION).\n' +
        '- **Property**: CRUD de imóveis. Status: RASCUNHO, DISPONIVEL, VENDIDO. Exige e-mail verificado e CRECI para criar. Imagem principal = primeira por sort_order.\n' +
        '- **Listings**: Listagem pública com filtros. Recomendações: preço máx = min(entrada/0.2, entrada+renda×120); ordenação por estado/cidade.\n' +
        '- **Health**: Firebase, Mail, Supabase. Retorna 200 ou 503.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
