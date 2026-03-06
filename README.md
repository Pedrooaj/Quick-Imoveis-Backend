# Quick Imóveis API

API REST para plataforma de imóveis com **compradores** e **corretores**. NestJS, Prisma, PostgreSQL (Supabase).

## Documentação

- **[docs/API.md](docs/API.md)** – Rotas, regras de acesso e lógica de negócio
- **[docs/API_ERROR_FORMAT.md](docs/API_ERROR_FORMAT.md)** – Formato de erros
- **Swagger** – `GET /docs` (com servidor rodando)

## Setup

```bash
npm install
```

Configure as variáveis de ambiente (`.env`) e execute as migrations:

```bash
npx prisma migrate deploy
```

## Executar

```bash
# desenvolvimento
npm run start:dev

# produção
npm run start:prod
```

## Testes

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Estrutura

| Módulo    | Descrição                                      |
|-----------|------------------------------------------------|
| **Auth**  | Login, cadastro, recuperação de senha, perfil   |
| **Property** | CRUD de imóveis (corretor)                  |
| **Listings** | Listagem pública e recomendações            |
| **Health**   | Status dos serviços (Firebase, Mail, Supabase) |

## Licença

MIT
