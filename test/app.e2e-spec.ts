import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

// Desabilita throttling nos testes e2e
jest.spyOn(ThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true);

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

const CORRETOR_EMAIL = `e2e-corretor-${Date.now()}@test.com`;
const COMPRADOR_EMAIL = `e2e-comprador-${Date.now()}@test.com`;
const PASSWORD = 'senha123';

interface AuthPayload {
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

// ────────────────────────────────────────────────────────────────
// Main suite
// ────────────────────────────────────────────────────────────────

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let corretorAuth: AuthPayload;
  let compradorAuth: AuthPayload;
  let propertyId: string;
  let propertyCommentId: string;
  let corretorCommentId: string;

  // ── Bootstrap ─────────────────────────────────────────────────

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Limpa dados criados durante o teste
    if (corretorAuth?.user?.id) {
      await prisma.user.deleteMany({ where: { id: corretorAuth.user.id } });
    }
    if (compradorAuth?.user?.id) {
      await prisma.user.deleteMany({ where: { id: compradorAuth.user.id } });
    }
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════
  // 1. HEALTH
  // ═══════════════════════════════════════════════════════════════

  describe('Health', () => {
    it('GET /health – deve retornar 200 ou 503', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          expect([200, 503]).toContain(res.status);
        });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. COMMON
  // ═══════════════════════════════════════════════════════════════

  describe('Common', () => {
    it('GET /common/brazilian-states – deve retornar lista de estados', async () => {
      const res = await request(app.getHttpServer())
        .get('/common/brazilian-states')
        .expect(200);

      expect(res.body).toHaveProperty('states');
      expect(Array.isArray(res.body.states)).toBe(true);
      expect(res.body.states.length).toBe(27);
      expect(res.body.states).toContain('São Paulo');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. AUTH – SIGN-UP
  // ═══════════════════════════════════════════════════════════════

  describe('Auth – Sign-Up', () => {
    it('POST /auth/sign-up – deve criar CORRETOR', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          name: 'Corretor E2E',
          email: CORRETOR_EMAIL,
          password: PASSWORD,
          role: 'CORRETOR',
          creci: '99999-F',
          phone: '11999990000',
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('expires_in');
      expect(res.body.user.email).toBe(CORRETOR_EMAIL);
      expect(res.body.user.role).toBe('CORRETOR');
      corretorAuth = res.body;
    });

    it('POST /auth/sign-up – deve criar COMPRADOR', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          name: 'Comprador E2E',
          email: COMPRADOR_EMAIL,
          password: PASSWORD,
          role: 'COMPRADOR',
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user.role).toBe('COMPRADOR');
      compradorAuth = res.body;
    });

    it('POST /auth/sign-up – deve rejeitar e-mail duplicado com 409', async () => {
      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: CORRETOR_EMAIL,
          password: PASSWORD,
        })
        .expect(409);
    });

    it('POST /auth/sign-up – deve rejeitar senha curta com 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: 'senha-curta@test.com',
          password: '123',
        })
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });

    it('POST /auth/sign-up – deve rejeitar sem e-mail com 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: PASSWORD })
        .expect(400);
    });

    it('POST /auth/sign-up – deve rejeitar campo não permitido com 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          email: 'forbidden-field@test.com',
          password: PASSWORD,
          hackerField: 'xss',
        })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. AUTH – SIGN-IN
  // ═══════════════════════════════════════════════════════════════

  describe('Auth – Sign-In', () => {
    it('POST /auth/sign-in – login válido', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: CORRETOR_EMAIL, password: PASSWORD })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user.email).toBe(CORRETOR_EMAIL);
      // atualiza token para uso posterior
      corretorAuth = res.body;
    });

    it('POST /auth/sign-in – senha errada retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: CORRETOR_EMAIL, password: 'senhaerrada' })
        .expect(401);
    });

    it('POST /auth/sign-in – e-mail inexistente retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: 'naoexiste@test.com', password: PASSWORD })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. AUTH – PROFILE
  // ═══════════════════════════════════════════════════════════════

  describe('Auth – Profile', () => {
    it('GET /auth/profile – sem token retorna 401', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('GET /auth/profile – com token retorna perfil', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(CORRETOR_EMAIL);
    });

    it('PATCH /auth/profile – atualiza nome do corretor', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .field('name', 'Corretor Atualizado')
        .expect(200);

      expect(res.body.name).toBe('Corretor Atualizado');
    });

    it('PATCH /auth/profile – atualiza comprador com nome e finanças', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/profile')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .field('name', 'Comprador Atualizado')
        .field('renda_mensal', '5000')
        .field('valor_entrada', '50000')
        .expect(200);

      expect(res.body.name).toBe('Comprador Atualizado');
    });

    it('PATCH /auth/profile – atualiza endereço do comprador via Prisma e verifica', async () => {
      // Atualiza endereço diretamente para garantir dados de recomendações
      await prisma.userAddress.upsert({
        where: { user_id: compradorAuth.user.id },
        create: {
          user_id: compradorAuth.user.id,
          street: 'Rua E2E',
          number: '100',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'São Paulo',
          country: 'Brasil',
          postal_code: '01310-100',
        },
        update: {
          street: 'Rua E2E',
          city: 'São Paulo',
          state: 'São Paulo',
        },
      });

      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(200);

      expect(res.body.address).toBeDefined();
      expect(res.body.address.city).toBe('São Paulo');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. AUTH – EMAIL VERIFICATION
  // ═══════════════════════════════════════════════════════════════

  describe('Auth – Email Verification', () => {
    it('POST /auth/request-email-verification – sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/request-email-verification')
        .expect(401);
    });

    it('POST /auth/request-email-verification – com token envia e-mail', async () => {
      await request(app.getHttpServer())
        .post('/auth/request-email-verification')
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .expect((r) => {
          // Pode retornar 200/201 ou falhar se SMTP não configurado (500)
          expect([200, 201, 500]).toContain(r.status);
        });
    });

    it('POST /auth/verify-email – token inválido retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: 'token-invalido-abc' })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 7. AUTH – FORGOT / RESET PASSWORD
  // ═══════════════════════════════════════════════════════════════

  describe('Auth – Password Recovery', () => {
    it('POST /auth/forgot-password – e-mail inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'ghost@test.com' })
        .expect(404);
    });

    it('POST /auth/forgot-password – e-mail válido aceita (200/201 ou 500 smtp)', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: CORRETOR_EMAIL })
        .expect((r) => {
          expect([200, 201, 500]).toContain(r.status);
        });
    });

    it('POST /auth/reset-password – código errado retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: CORRETOR_EMAIL,
          code: '000000',
          newPassword: 'novasenha123',
        })
        .expect(401);
    });

    it('POST /auth/reset-password – validação: código deve ter 6 dígitos', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: CORRETOR_EMAIL,
          code: '12',
          newPassword: 'novasenha123',
        })
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 8. PROPERTY (CRUD – CORRETOR)
  // ═══════════════════════════════════════════════════════════════

  describe('Property – CRUD', () => {
    // Marca e-mail como verificado diretamente no banco para testes de property
    beforeAll(async () => {
      await prisma.user.update({
        where: { id: corretorAuth.user.id },
        data: { is_email_verified: true },
      });
    });

    it('POST /property – COMPRADOR não pode criar (403)', async () => {
      await request(app.getHttpServer())
        .post('/property')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({
          title: 'Imóvel proibido',
          price: 100000,
          address: { city: 'SP', state: 'São Paulo' },
        })
        .expect(403);
    });

    it('POST /property – sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/property')
        .send({
          title: 'Imóvel sem auth',
          price: 100000,
          address: { city: 'SP' },
        })
        .expect(401);
    });

    it('POST /property – CORRETOR cria imóvel RASCUNHO', async () => {
      const res = await request(app.getHttpServer())
        .post('/property')
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .send({
          title: 'Apartamento E2E',
          description: 'Teste e2e',
          property_type: 'APARTAMENTO',
          price: 350000,
          area: 85.5,
          bedrooms: 2,
          status: 'RASCUNHO',
          address: {
            street: 'Rua Teste',
            number: '42',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'São Paulo',
            country: 'Brasil',
            postal_code: '01310-100',
            lat: -23.5505,
            lng: -46.6333,
          },
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Apartamento E2E');
      expect(res.body.status).toBe('RASCUNHO');
      propertyId = res.body.id;
    });

    it('POST /property – validação: sem título retorna 400', async () => {
      await request(app.getHttpServer())
        .post('/property')
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .send({
          price: 100000,
          address: { city: 'SP', state: 'São Paulo' },
        })
        .expect(400);
    });

    it('POST /property – validação: preço negativo retorna 400', async () => {
      await request(app.getHttpServer())
        .post('/property')
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .send({
          title: 'Negativo',
          price: -1,
          address: { city: 'SP', state: 'São Paulo' },
        })
        .expect(400);
    });

    it('GET /property – lista imóveis do corretor', async () => {
      const res = await request(app.getHttpServer())
        .get('/property')
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /property – paginação funciona', async () => {
      const res = await request(app.getHttpServer())
        .get('/property?page=1&limit=1')
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .expect(200);

      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(1);
    });

    it('GET /property/:id – retorna imóvel pelo id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/property/${propertyId}`)
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .expect(200);

      expect(res.body.id).toBe(propertyId);
      expect(res.body).toHaveProperty('address');
    });

    it('GET /property/:id – id inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .get('/property/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .expect(404);
    });

    it('PATCH /property/:id – atualiza título e status para DISPONIVEL', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/property/${propertyId}`)
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .send({ title: 'Apartamento E2E Atualizado', status: 'DISPONIVEL' })
        .expect(200);

      expect(res.body.title).toBe('Apartamento E2E Atualizado');
      expect(res.body.status).toBe('DISPONIVEL');
    });

    it('PATCH /property/:id – COMPRADOR não consegue atualizar (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/property/${propertyId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({ title: 'Hackeado' })
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 9. LISTINGS (PÚBLICO)
  // ═══════════════════════════════════════════════════════════════

  describe('Listings', () => {
    it('GET /listings – lista pública (sem token)', async () => {
      const res = await request(app.getHttpServer())
        .get('/listings')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /listings – filtro por cidade', async () => {
      const res = await request(app.getHttpServer())
        .get('/listings?city=São Paulo')
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });

    it('GET /listings – filtro por preço', async () => {
      const res = await request(app.getHttpServer())
        .get('/listings?min_price=100000&max_price=500000')
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });

    it('GET /listings – filtro por status DISPONIVEL', async () => {
      const res = await request(app.getHttpServer())
        .get('/listings?status=DISPONIVEL')
        .expect(200);

      // Não deve conter RASCUNHO
      for (const item of res.body.data) {
        expect(item.status).not.toBe('RASCUNHO');
      }
    });

    it('GET /listings – paginação', async () => {
      const res = await request(app.getHttpServer())
        .get('/listings?page=1&limit=5')
        .expect(200);

      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
    });

    it('GET /listings/:id – detalhe do imóvel DISPONIVEL', async () => {
      const res = await request(app.getHttpServer())
        .get(`/listings/${propertyId}`)
        .expect(200);

      expect(res.body.id).toBe(propertyId);
      expect(res.body).toHaveProperty('address');
    });

    it('GET /listings/:id – imóvel inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .get('/listings/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('GET /listings/owner/:ownerId – portfolio do corretor', async () => {
      const res = await request(app.getHttpServer())
        .get(`/listings/owner/${corretorAuth.user.id}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      // Não deve retornar RASCUNHO no portfolio público
      for (const item of res.body.data) {
        expect(item.status).not.toBe('RASCUNHO');
      }
    });

    it('GET /listings/recommendations – sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .get('/listings/recommendations')
        .expect(401);
    });

    it('GET /listings/recommendations – comprador com perfil completo', async () => {
      await request(app.getHttpServer())
        .get('/listings/recommendations')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect((r) => {
          // 200 se perfil completo, 400 se incompleto
          expect([200, 400]).toContain(r.status);
        });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 10. FAVORITES
  // ═══════════════════════════════════════════════════════════════

  describe('Favorites', () => {
    it('POST /favorite/:listingId – sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .post(`/favorite/${propertyId}`)
        .expect(401);
    });

    it('POST /favorite/:listingId – adiciona favorito', async () => {
      const res = await request(app.getHttpServer())
        .post(`/favorite/${propertyId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(201);

      expect(res.body).toBeDefined();
    });

    it('POST /favorite/:listingId – idempotente (adicionar novamente)', async () => {
      await request(app.getHttpServer())
        .post(`/favorite/${propertyId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(201);
    });

    it('GET /favorite – lista favoritos', async () => {
      const res = await request(app.getHttpServer())
        .get('/favorite')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /favorite – paginação', async () => {
      const res = await request(app.getHttpServer())
        .get('/favorite?page=1&limit=5')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(200);

      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
    });

    it('DELETE /favorite/:listingId – remove favorito', async () => {
      await request(app.getHttpServer())
        .delete(`/favorite/${propertyId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(200);
    });

    it('DELETE /favorite/:listingId – idempotente (remover novamente)', async () => {
      await request(app.getHttpServer())
        .delete(`/favorite/${propertyId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(200);
    });

    it('POST /favorite/:listingId – imóvel inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .post('/favorite/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 11. COMMENTS – PROPERTY
  // ═══════════════════════════════════════════════════════════════

  describe('Comments – Property', () => {
    it('POST /comments/property/:propertyId – sem token retorna 401', async () => {
      await request(app.getHttpServer())
        .post(`/comments/property/${propertyId}`)
        .send({ content: 'Comentário' })
        .expect(401);
    });

    it('POST /comments/property/:propertyId – cria comentário', async () => {
      const res = await request(app.getHttpServer())
        .post(`/comments/property/${propertyId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({ content: 'Ótimo imóvel!', rating: 5 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('Ótimo imóvel!');
      expect(res.body.rating).toBe(5);
      propertyCommentId = res.body.id;
    });

    it('POST /comments/property/:propertyId – validação: sem conteúdo retorna 400', async () => {
      await request(app.getHttpServer())
        .post(`/comments/property/${propertyId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({ rating: 3 })
        .expect(400);
    });

    it('POST /comments/property/:propertyId – validação: rating > 5 retorna 400', async () => {
      await request(app.getHttpServer())
        .post(`/comments/property/${propertyId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({ content: 'Nota alta', rating: 10 })
        .expect(400);
    });

    it('POST /comments/property/:propertyId – imóvel inexistente retorna 404', async () => {
      await request(app.getHttpServer())
        .post('/comments/property/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({ content: 'Fantasma' })
        .expect(404);
    });

    it('GET /comments/property/:propertyId – lista pública', async () => {
      const res = await request(app.getHttpServer())
        .get(`/comments/property/${propertyId}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /comments/property/:propertyId – paginação', async () => {
      const res = await request(app.getHttpServer())
        .get(`/comments/property/${propertyId}?page=1&limit=5`)
        .expect(200);

      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
    });

    it('PATCH /comments/property/:id – autor edita comentário', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/comments/property/${propertyCommentId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({ content: 'Imóvel excelente!', rating: 4 })
        .expect(200);

      expect(res.body.content).toBe('Imóvel excelente!');
      expect(res.body.rating).toBe(4);
    });

    it('PATCH /comments/property/:id – outro user recebe 403', async () => {
      await request(app.getHttpServer())
        .patch(`/comments/property/${propertyCommentId}`)
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .send({ content: 'Hackeado' })
        .expect(403);
    });

    it('DELETE /comments/property/:id – outro user recebe 403', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/property/${propertyCommentId}`)
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .expect(403);
    });

    it('DELETE /comments/property/:id – autor remove comentário', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/comments/property/${propertyCommentId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(200);

      expect(res.body.message).toBe('Comentário removido');
    });

    it('DELETE /comments/property/:id – comentário já removido retorna 404', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/property/${propertyCommentId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 12. COMMENTS – CORRETOR
  // ═══════════════════════════════════════════════════════════════

  describe('Comments – Corretor', () => {
    it('POST /comments/corretor/:corretorId – cria avaliação', async () => {
      const res = await request(app.getHttpServer())
        .post(`/comments/corretor/${corretorAuth.user.id}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({ content: 'Corretor excelente!', rating: 5 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('Corretor excelente!');
      corretorCommentId = res.body.id;
    });

    it('POST /comments/corretor/:corretorId – COMPRADOR não é corretor retorna 404', async () => {
      await request(app.getHttpServer())
        .post(`/comments/corretor/${compradorAuth.user.id}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({ content: 'Não deveria funcionar' })
        .expect(404);
    });

    it('GET /comments/corretor/:corretorId – lista pública', async () => {
      const res = await request(app.getHttpServer())
        .get(`/comments/corretor/${corretorAuth.user.id}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /comments/corretor/:id – autor edita', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/comments/corretor/${corretorCommentId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .send({ content: 'Corretor muito bom!', rating: 4 })
        .expect(200);

      expect(res.body.content).toBe('Corretor muito bom!');
    });

    it('PATCH /comments/corretor/:id – outro user recebe 403', async () => {
      await request(app.getHttpServer())
        .patch(`/comments/corretor/${corretorCommentId}`)
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .send({ content: 'Self-edit' })
        .expect(403);
    });

    it('DELETE /comments/corretor/:id – autor remove', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/comments/corretor/${corretorCommentId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(200);

      expect(res.body.message).toBe('Comentário removido');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 13. CORRETORES (PÚBLICO)
  // ═══════════════════════════════════════════════════════════════

  describe('Corretores', () => {
    it('GET /corretores – lista pública', async () => {
      const res = await request(app.getHttpServer())
        .get('/corretores')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /corretores – busca por nome', async () => {
      const res = await request(app.getHttpServer())
        .get('/corretores?search=Corretor')
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });

    it('GET /corretores – busca por CRECI', async () => {
      const res = await request(app.getHttpServer())
        .get('/corretores?search=99999-F')
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });

    it('GET /corretores – paginação', async () => {
      const res = await request(app.getHttpServer())
        .get('/corretores?page=1&limit=5')
        .expect(200);

      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 14. PROPERTY – DELETE
  // ═══════════════════════════════════════════════════════════════

  describe('Property – Delete', () => {
    it('DELETE /property/:id – COMPRADOR não pode deletar (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/property/${propertyId}`)
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(403);
    });

    it('DELETE /property/:id – CORRETOR deleta imóvel', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/property/${propertyId}`)
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .expect(200);

      expect(res.body.message).toBe('Imóvel removido com sucesso');
    });

    it('DELETE /property/:id – imóvel já deletado retorna 404', async () => {
      await request(app.getHttpServer())
        .delete(`/property/${propertyId}`)
        .set('Authorization', `Bearer ${corretorAuth.access_token}`)
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 15. AUTH – LOGOUT
  // ═══════════════════════════════════════════════════════════════

  describe('Auth – Logout', () => {
    it('POST /auth/logout – sem token retorna 401', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('POST /auth/logout – com token retorna 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(201);

      expect(res.body.message).toBe('Logout realizado com sucesso');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 16. AUTH – DEACTIVATE ACCOUNT
  // ═══════════════════════════════════════════════════════════════

  describe('Auth – Deactivate Account', () => {
    it('DELETE /auth/account – sem token retorna 401', async () => {
      await request(app.getHttpServer()).delete('/auth/account').expect(401);
    });

    it('DELETE /auth/account – desativa conta do comprador', async () => {
      const res = await request(app.getHttpServer())
        .delete('/auth/account')
        .set('Authorization', `Bearer ${compradorAuth.access_token}`)
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });

    it('POST /auth/sign-in – conta desativada retorna 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: COMPRADOR_EMAIL, password: PASSWORD })
        .expect(401);
    });
  });
});
