/** Rodadas de salt para hash bcrypt */
export const BCRYPT_SALT_ROUNDS = 10;

/** Validade do código de recuperação de senha em minutos */
export const PASSWORD_RESET_CODE_EXPIRATION_MINUTES = 5;

/** Validade do código de verificação de e-mail em minutos */
export const EMAIL_VERIFICATION_CODE_EXPIRATION_MINUTES = 5;

/** Quantidade de dígitos do código de recuperação */
export const PASSWORD_RESET_CODE_LENGTH = 6;

/** Valor mínimo para código de 6 dígitos (100000) */
export const PASSWORD_RESET_CODE_MIN = 10 ** (PASSWORD_RESET_CODE_LENGTH - 1);

/** Valor máximo para código de 6 dígitos (999999) */
export const PASSWORD_RESET_CODE_MAX =
  10 ** PASSWORD_RESET_CODE_LENGTH - 1;

/** Validade padrão do access token JWT */
export const JWT_EXPIRATION_DEFAULT = '15m';
