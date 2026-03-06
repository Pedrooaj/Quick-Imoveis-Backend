import { SetMetadata } from '@nestjs/common';

export const OPTIONAL_AUTH_KEY = 'optionalAuth';

/**
 * Marca a rota como opcionalmente autenticada.
 * Se o usuário enviar um token válido, será injetado. Caso contrário, a rota continua funcionando.
 */
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);
