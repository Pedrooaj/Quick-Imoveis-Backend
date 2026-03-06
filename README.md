# Quick Imóveis API

API REST para plataforma de imóveis com **compradores** e **corretores**.

**Stack**: NestJS · TypeScript · Prisma · PostgreSQL (Supabase) · Firebase (Auth + Storage) · Nodemailer

---

## Documentação

- **Swagger interativo**: `GET /docs` (com servidor rodando)
- **[docs/API.md](docs/API.md)** – Rotas detalhadas, regras de acesso e lógica de negócio
- **[docs/API_ERROR_FORMAT.md](docs/API_ERROR_FORMAT.md)** – Formato padronizado de erros

---

## Setup

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Gerar Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate deploy

# Popular banco com dados de exemplo (opcional)
npm run db:seed
```

### Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |
| `JWT_EXPIRATION` | Validade do access token (ex.: `15m`, `1h`). Padrão: `15m` |
| `DATABASE_URL` | Connection string do PostgreSQL |
| `FRONTEND_URL` | URL do frontend (para links de e-mail) |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID (Google) |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret (Google) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Configuração SMTP |
| `MAIL_FROM` | Remetente dos e-mails |
| `FIREBASE_STORAGE_BUCKET` | Bucket do Firebase Storage |
| `CORS_ORIGIN` | Origens permitidas (separadas por `,`) |

---

## Executar

```bash
# Desenvolvimento (hot-reload)
npm run start:dev

# Produção
npm run build && npm run start:prod
```

---

## Testes

```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end
npm run test:cov      # Coverage
```

---

## Módulos

| Módulo | Prefixo | Descrição |
|--------|---------|-----------|
| **Auth** | `/auth` | Login (e-mail/senha, Google), cadastro, recuperação de senha, verificação de e-mail, perfil |
| **Property** | `/property` | CRUD de imóveis (apenas CORRETOR). Upload de imagens para Firebase Storage |
| **Listings** | `/listings` | Listagem pública com filtros, portfolio do corretor, recomendações personalizadas |
| **Comments** | `/comments` | Comentários e avaliações em imóveis e corretores |
| **Favorite** | `/favorite` | Favoritar/desfavoritar imóveis |
| **Corretores** | `/corretores` | Listagem pública de corretores (ranking por favoritos) |
| **Common** | `/common` | Estados brasileiros |
| **Health** | `/health` | Status dos serviços (Firebase, Mail, Supabase) |

---

## Regras de acesso

| Tipo | Descrição |
|------|-----------|
| **Público** | Sem token: sign-in, sign-up, Google login, forgot/reset password, verify-email, GET /listings, GET /corretores, GET /comments/*, GET /health |
| **Autenticado** | `Authorization: Bearer <token>`: perfil, favoritos, POST/PATCH/DELETE comentários, recomendações |
| **CORRETOR** | Autenticado + role CORRETOR: todas as rotas de `/property` |

### Papéis

| Role | Permissões |
|------|-----------|
| `COMPRADOR` | Favoritar imóveis, ver recomendações, comentar |
| `CORRETOR` | Gerenciar imóveis, upload de imagens, comentar |

---

## Rotas resumidas

### Auth (`/auth`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/auth/sign-in` | Público | Login com e-mail/senha → `access_token` + `expires_in` |
| POST | `/auth/sign-up` | Público | Cadastro → `access_token` + `expires_in` |
| POST | `/auth/google` | Público | Login com Google (id_token ou access_token) |
| POST | `/auth/forgot-password` | Público | Envia código 6 dígitos por e-mail (5 min) |
| POST | `/auth/reset-password` | Público | Redefine senha com código |
| POST | `/auth/verify-email` | Público | Valida token do link de verificação (5 min) |
| POST | `/auth/request-email-verification` | Autenticado | Solicita novo link de verificação |
| GET | `/auth/profile` | Autenticado | Dados do perfil |
| PATCH | `/auth/profile` | Autenticado | Atualiza perfil (multipart/form-data) |

### Property (`/property`) — CORRETOR

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/property` | Criar imóvel (exige e-mail verificado + CRECI) |
| GET | `/property` | Listar imóveis do corretor |
| GET | `/property/:id` | Detalhe do imóvel |
| PATCH | `/property/:id` | Atualizar imóvel |
| DELETE | `/property/:id` | Remover imóvel |
| POST | `/property/:id/images` | Upload de imagem (máx. 5MB) |
| PATCH | `/property/:id/images/reorder` | Reordenar imagens |
| DELETE | `/property/:id/images/:imageId` | Remover imagem |

> Ao criar ou atualizar um imóvel com status `DISPONIVEL`, compradores com perfil compatível (localização + faixa de preço) recebem e-mail de recomendação automaticamente.

### Listings (`/listings`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/listings` | Público | Listagem com filtros: `min_price`, `max_price`, `city`, `neighborhood`, `status`, `page`, `limit` |
| GET | `/listings/:id` | Público | Detalhe do imóvel (DISPONIVEL ou VENDIDO) |
| GET | `/listings/owner/:ownerId` | Público | Portfolio do corretor (sem RASCUNHO) |
| GET | `/listings/recommendations` | Autenticado | Recomendações por proximidade e faixa de preço |

**Fórmula de recomendação**: preço máx = `min(entrada/0.2, entrada + renda×120)`

### Comments (`/comments`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/comments/property/:propertyId` | Público | Listar comentários de um imóvel |
| POST | `/comments/property/:propertyId` | Autenticado | Comentar em um imóvel |
| PATCH | `/comments/property/:commentId` | Autor | Editar comentário de imóvel |
| DELETE | `/comments/property/:commentId` | Autor | Remover comentário de imóvel |
| GET | `/comments/corretor/:corretorId` | Público | Listar comentários de um corretor |
| POST | `/comments/corretor/:corretorId` | Autenticado | Comentar sobre um corretor |
| PATCH | `/comments/corretor/:commentId` | Autor | Editar comentário de corretor |
| DELETE | `/comments/corretor/:commentId` | Autor | Remover comentário de corretor |

**Body para criar/editar**:
```json
{ "content": "Texto do comentário", "rating": 5 }
```
- `content` — obrigatório (string)
- `rating` — opcional (inteiro 1-5)

**Resposta de listagem**:
```json
{
  "data": [{
    "id": "uuid",
    "content": "Ótima localização!",
    "rating": 5,
    "created_at": "2026-03-06T...",
    "updated_at": "2026-03-06T...",
    "author": { "id": "uuid", "name": "João Silva", "avatar_url": "https://..." }
  }],
  "meta": { "total": 10, "page": 1, "limit": 10, "totalPages": 1 }
}
```

### Favorite (`/favorite`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/favorite` | Autenticado | Listar favoritos com paginação |
| POST | `/favorite/:listingId` | Autenticado | Favoritar imóvel (idempotente) |
| DELETE | `/favorite/:listingId` | Autenticado | Desfavoritar (idempotente) |

### Corretores (`/corretores`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/corretores` | Público | Lista corretores por ranking de favoritos. Query: `search`, `page`, `limit` |

### Common (`/common`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/common/brazilian-states` | Público | Lista de estados brasileiros |

### Health (`/health`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/health` | Público | Status: Firebase, Mail, Supabase. Retorna 200 ou 503 |

---

## Formato de erros

Todas as respostas de erro seguem o padrão:

```json
{
  "statusCode": 400,
  "message": "Mensagem de erro",
  "error": "Bad Request"
}
```

- `message` pode ser `string` (erro único) ou `string[]` (validação).
- Detalhes em [docs/API_ERROR_FORMAT.md](docs/API_ERROR_FORMAT.md).

---

## Seed (dados de exemplo)

```bash
npm run db:seed
```

Cria: 2 corretores, 1 comprador, 20 imóveis (10 estados, 5 tipos), 4 favoritos, 6 comentários.

| Usuário | E-mail | Senha | Role |
|---------|--------|-------|------|
| Carlos Mendes | corretor@quickimoveis.com | senha123 | CORRETOR |
| Maria Oliveira | maria.corretor@quickimoveis.com | senha123 | CORRETOR |
| João Silva | comprador@quickimoveis.com | senha123 | COMPRADOR |

---

## Estrutura do projeto

```
src/
├── auth/            # Autenticação, perfil, guards, strategies
├── comments/        # Comentários em imóveis e corretores
├── common/          # Enums, filtros globais
├── corretores/      # Listagem pública de corretores
├── favorite/        # Favoritos
├── firebase/        # Firebase Admin SDK (Auth + Storage)
├── health/          # Health checks
├── listings/        # Listagem pública e recomendações
├── mail/            # Nodemailer (SMTP)
├── prisma/          # Schema, migrations, seed
├── property/        # CRUD de imóveis (corretor)
├── users/           # Serviço de usuários
├── app.module.ts
└── main.ts
```

---

## Licença

UNLICENSED
