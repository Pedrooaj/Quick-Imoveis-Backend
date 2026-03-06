# Padrão de erros da API

## Formato da resposta

O backend responde com **JSON** no body e o **status HTTP** adequado.

## Estrutura do body

```json
{
  "statusCode": 400,
  "message": "Mensagem de erro",
  "error": "Bad Request"
}
```

| Campo      | Tipo              | Obrigatório | Descrição                                                       |
|-----------|-------------------|-------------|-----------------------------------------------------------------|
| `statusCode` | `number`        | Sim         | Código HTTP (400, 401, 403, 404, 409, 422, 500, etc.)           |
| `message` | `string` ou `string[]` | Sim         | Mensagem exibida ao usuário. Array em erros de validação        |
| `error`   | `string`         | Sim         | Tipo do erro (ex.: "Bad Request", "Unauthorized")               |

## Exemplos

**Erro simples (string):**
```json
{
  "statusCode": 400,
  "message": "Email já cadastrado.",
  "error": "Bad Request"
}
```

**Erros de validação (array):**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be at least 6 characters"
  ],
  "error": "Bad Request"
}
```

O frontend junta as mensagens do array com `. ` (ex.: `"email must be an email. password must be at least 6 characters"`).

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Token inválido ou expirado",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Acesso negado a este recurso",
  "error": "Forbidden"
}
```

## Comportamento do frontend

- Se `message` for string e não vazia → usa essa mensagem.
- Se `message` for array → junta com `. ` e exibe.
- Se `message` for vazio ou ausente → usa mensagem padrão conforme o `statusCode`.
- Se o body não for JSON válido → usa o texto bruto ou mensagem padrão.

## Implementação

O `HttpExceptionFilter` em `src/common/filters/http-exception.filter.ts` garante que todas as exceções (incluindo `HttpException`, `ValidationPipe` e erros não tratados) retornem esse formato.
