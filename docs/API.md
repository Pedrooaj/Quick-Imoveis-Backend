# Quick Imóveis – Documentação da API

API REST para plataforma de imóveis com **compradores** e **corretores**. NestJS, Prisma, PostgreSQL (Supabase).

- **Swagger**: `GET /docs` (interativo)
- **Base URL**: `http://localhost:3000` (ou variável `PORT`)

---

## Regras de acesso às rotas

### Autenticação global

Por padrão, **todas as rotas exigem token JWT** no header:

```
Authorization: Bearer <token>
```

Rotas marcadas como **Públicas** (`@Public()`) não exigem autenticação.

### Papéis (roles)

| Papel     | Descrição                                      |
|-----------|------------------------------------------------|
| `COMPRADOR` | Comprador de imóveis                           |
| `CORRETOR`  | Corretor – pode criar e gerenciar imóveis      |

### Resumo por módulo

| Módulo    | Rotas públicas                         | Rotas autenticadas                         |
|-----------|----------------------------------------|-------------------------------------------|
| **Auth**  | sign-in, sign-up, google, forgot-password, reset-password, verify-email | profile, update profile, request-email-verification, logout |
| **Property** | —                                  | Todas (apenas **CORRETOR**)               |
| **Listings** | GET /, GET /:id, GET /owner/:ownerId | GET /recommendations                       |
| **Common**   | GET /brazilian-states               | —                                         |
| **Favorite** | —                                  | GET /favorite, POST /favorite/:listingId, DELETE /favorite/:listingId |
| **Comments** | GET /comments/property/:id, GET /comments/corretor/:id | POST, PATCH, DELETE (autenticado, autor) |
| **Corretores** | GET /corretores                    | —                                         |
| **Health**   | GET /                                | —                                         |

---

## Rotas por módulo

### Common (`/common`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/common/brazilian-states` | Público | Lista de estados do Brasil (nomes completos) para uso em selects de endereço. Resposta: `{ "states": ["Acre", "Alagoas", ...] }`. |

### Corretores (`/corretores`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/corretores` | Público | Lista corretores ordenados pela quantidade de favoritos nos imóveis (mais favoritados primeiro). Query: `search` (nome ou CRECI), `page`, `limit`. Resposta: `{ data: [{ id, name, email, creci, phone, whatsapp, favoritesCount }], meta: { total, page, limit, totalPages } }`. |

### Auth (`/auth`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/auth/sign-in` | Público | Login com e-mail e senha. Retorna `access_token` e `expires_in`. |
| POST | `/auth/google` | Público | Login com Google (id_token ou access_token). Cria usuário se não existir. Retorna `access_token` e `expires_in`. |
| POST | `/auth/sign-up` | Público | Cadastro. Retorna `access_token` e `expires_in`. |
| POST | `/auth/forgot-password` | Público | Envia código de 6 dígitos por e-mail. |
| POST | `/auth/reset-password` | Público | Redefine senha com código recebido. |
| POST | `/auth/verify-email` | Público | Valida token do link de verificação. |
| POST | `/auth/request-email-verification` | Autenticado | Solicita novo link de verificação. |
| GET | `/auth/profile` | Autenticado | Dados do perfil (avatar, endereço, renda, etc.). |
| PATCH | `/auth/profile` | Autenticado | Atualiza perfil (multipart/form-data). |

**Lógica / cálculos**

- **Senha**: hash bcrypt (10 rodadas).
- **Código de recuperação**: 6 dígitos, válido por **5 minutos**.
- **Link de verificação de e-mail**: válido por **5 minutos**.
- **Access token**: JWT (padrão **15 min**; configurável via `JWT_EXPIRATION`). Enviar no header `Authorization: Bearer <access_token>`.
- Resposta de login/cadastro inclui `expires_in` (segundos de validade do access token).

### Favorite (`/favorite`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/favorite` | Autenticado | Lista imóveis favoritos do usuário atual, com paginação. Resposta: `{ data: [...properties], meta: { total, page, limit, totalPages } }`. |
| POST | `/favorite/:listingId` | Autenticado | Marca o imóvel (`properties.id`) como favorito para o usuário atual. Idempotente – se já for favorito, apenas retorna o imóvel. |
| DELETE | `/favorite/:listingId` | Autenticado | Remove o imóvel dos favoritos do usuário atual. Idempotente – se não for favorito, responde sucesso mesmo assim. |

---

### Property (`/property`)

**Todas as rotas exigem autenticação e papel CORRETOR.**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/property` | Criar imóvel. |
| GET | `/property` | Listar imóveis do corretor. |
| GET | `/property/:id` | Detalhe do imóvel (apenas se for do corretor). |
| PATCH | `/property/:id` | Atualizar imóvel. |
| DELETE | `/property/:id` | Remover imóvel. |
| POST | `/property/:id/images` | Adicionar imagem (multipart, máx. 5MB). |
| PATCH | `/property/:id/images/reorder` | Reordenar imagens. |
| DELETE | `/property/:id/images/:imageId` | Remover imagem. |

**Regras de negócio**

- **Criar imóvel**: exige e-mail verificado e CRECI preenchido no perfil.
- **Endereço**: obrigatório na criação.
- **Status**: `RASCUNHO` (rascunho) ou `DISPONIVEL` (publicado em /listings) ou `VENDIDO`.
- **Imagem principal**: a primeira da ordem (`sort_order`) é considerada principal.

---

### Listings (`/listings`)

#### `GET /listings` – Listar todos (público)

Lista imóveis com filtros opcionais. **Não exige autenticação.**

**Query params**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página (default: 1). |
| `limit` | number | Itens por página (default: 10). |
| `min_price` | number | Preço mínimo. |
| `max_price` | number | Preço máximo. |
| `city` | string | Cidade (case insensitive, contains). |
| `neighborhood` | string | Bairro (case insensitive, contains). |
| `status` | string | `DISPONIVEL`, `VENDIDO` ou `DISPONIVEL,VENDIDO`. Padrão: `DISPONIVEL`. |

**Lógica**

- Sem filtros: retorna imóveis com status `DISPONIVEL`.
- Filtros de preço, cidade e bairro são aplicados em conjunto.
- Ordenação: `updated_at` descendente.

---

#### `GET /listings/owner/:ownerId` – Imóveis de um corretor (portfolio)

- **Público.** Retorna imóveis de um corretor específico para usar como **portfolio** no frontend.
- Nunca retorna imóveis com status `RASCUNHO` – apenas `DISPONIVEL` e/ou `VENDIDO`.

**Path params**

| Parâmetro  | Tipo   | Descrição                         |
|------------|--------|-----------------------------------|
| `ownerId`  | string | UUID do corretor (`users.id`).   |

**Query params**

| Parâmetro | Tipo   | Descrição |
|-----------|--------|-----------|
| `page`    | number | Página (default: 1). |
| `limit`   | number | Itens por página (default: 10). |
| `status`  | string | `DISPONIVEL`, `VENDIDO` ou `DISPONIVEL,VENDIDO`. Padrão: ambos. |

**Resposta**

Mesmo formato de `GET /listings`:

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Apartamento ...",
      "status": "DISPONIVEL",
      "address": { "...": "..." },
      "images": [{ "id": "uuid", "image_url": "https://storage.googleapis.com/.../image.jpg", "sort_order": 0 }],
      "owner": { "name": "Corretor", "creci": "12345-F", "phone": "...", "whatsapp": "..." }
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

#### `GET /listings/recommendations` – Recomendações (autenticado)

Imóveis **DISPONIVEL** ordenados por proximidade e faixa de preço. **Exige autenticação.**

**Query params**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página (default: 1). |
| `limit` | number | Itens por página (default: 10). |

**Requisitos do perfil**

- Endereço cadastrado (obrigatório).
- E **pelo menos um** de: `state`, `city`, `renda_mensal` ou `valor_entrada`.

**Lógica e cálculos**

1. **Filtro de preço** (se `renda_mensal` ou `valor_entrada` preenchidos):
   - Preço máximo por entrada: `valor_entrada / 0.2` (entrada = 20% do valor).
   - Preço máximo por renda: `valor_entrada + renda_mensal × 120` (parcelas em 120 meses).
   - Usa o **menor** dos dois como teto de preço.

2. **Ordenação por proximidade**:
   - Prioridade 1: mesmo estado.
   - Prioridade 2: mesma cidade.
   - Demais: mantém ordem por `updated_at`.

---

#### `GET /listings/:id` – Detalhe (público)

Retorna detalhes do imóvel. Aceita status `DISPONIVEL` ou `VENDIDO`. **Não exige autenticação.**

---

### Comments (`/comments`)

#### Comentários em imóveis

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/comments/property/:propertyId` | Público | Lista comentários de um imóvel. Query: `page`, `limit`. Resposta paginada com `data` e `meta`. Cada comentário inclui `author: { id, name, avatar_url }`. |
| POST | `/comments/property/:propertyId` | Autenticado | Cria comentário em um imóvel. Body: `{ content: string, rating?: 1-5 }`. |
| PATCH | `/comments/property/:id` | Autor | Edita comentário. Body: `{ content?: string, rating?: 1-5 }`. Retorna 403 se não for o autor. |
| DELETE | `/comments/property/:id` | Autor | Remove comentário. Retorna `{ message: "Comentário removido" }`. Retorna 403 se não for o autor. |

#### Comentários em corretores

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/comments/corretor/:corretorId` | Público | Lista comentários/avaliações de um corretor. Query: `page`, `limit`. Retorna 404 se o usuário não for CORRETOR. |
| POST | `/comments/corretor/:corretorId` | Autenticado | Cria comentário sobre um corretor. Body: `{ content: string, rating?: 1-5 }`. |
| PATCH | `/comments/corretor/:id` | Autor | Edita comentário. Body: `{ content?: string, rating?: 1-5 }`. |
| DELETE | `/comments/corretor/:id` | Autor | Remove comentário. |

**Regras**

- **Listagem**: pública, sem autenticação. Ordenação por `created_at` descendente.
- **Criar**: qualquer usuário autenticado (CORRETOR ou COMPRADOR).
- **Editar/Remover**: apenas o autor do comentário (retorna 403 para outros).
- **Rating**: opcional, inteiro de 1 a 5.
- **Author**: sempre incluso na resposta: `{ id, name, avatar_url }`.

**Exemplo de resposta (listagem)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "author_id": "uuid",
      "property_id": "uuid",
      "content": "Ótima localização!",
      "rating": 5,
      "created_at": "2026-03-06T14:00:00.000Z",
      "updated_at": "2026-03-06T14:00:00.000Z",
      "author": { "id": "uuid", "name": "João Silva", "avatar_url": null }
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

### Health (`/health`)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/health` | Público | Verifica Firebase, Mail e Supabase. Retorna 200 ou 503. |

---

## Formato de erros

Todas as respostas de erro seguem o padrão descrito em [API_ERROR_FORMAT.md](./API_ERROR_FORMAT.md):

```json
{
  "statusCode": 400,
  "message": "Mensagem de erro",
  "error": "Bad Request"
}
```

---

## DTOs utilizados

| Módulo | DTO | Uso |
|--------|-----|-----|
| Auth | SignInDto, SignUpDto, GoogleAuthDto | Login e cadastro (incl. Google) |
| Auth | ForgotPasswordDto, ResetPasswordDto | Recuperação de senha |
| Auth | VerifyEmailDto | Verificação de e-mail |
| Auth | UpdateProfileDto | Atualização de perfil |
| Auth | AuthResponseDto, ProfileResponseDto | Swagger (respostas) |
| Property | CreatePropertyDto, UpdatePropertyDto | CRUD de imóveis |
| Property | AddressDto | Endereço (create/update) |
| Property | ReorderImagesDto | Reordenação de imagens |
| Comments | CreateCommentDto | Criar comentário (content + rating?) |
| Comments | UpdateCommentDto | Editar comentário (content? + rating?) |
| Users | CreateUserDto | Cadastro (via AuthService) |
| Health | HealthOkResponseDto, HealthErrorResponseDto | Swagger (respostas) |
