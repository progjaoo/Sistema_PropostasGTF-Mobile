import { apiCall } from '@/src/api/client';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_TOKEN_LENGTH = 20;

export class PasswordResetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordResetValidationError';
  }
}

export function getResetToken(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const token = candidate?.trim() ?? '';
  return token.length >= MIN_TOKEN_LENGTH ? token : null;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new PasswordResetValidationError('Informe um e-mail válido');
  }

  await apiCall('POST', '/auth/forgot-password', { email: normalizedEmail });
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  const token = getResetToken(input.token);
  if (!token) {
    throw new PasswordResetValidationError('Link de recuperação inválido');
  }
  if (input.newPassword.length < 8 || input.newPassword.length > 128) {
    throw new PasswordResetValidationError('A senha deve ter entre 8 e 128 caracteres');
  }
  if (input.newPassword !== input.confirmPassword) {
    throw new PasswordResetValidationError('As senhas não conferem');
  }

  await apiCall('POST', '/auth/reset-password', {
    token,
    newPassword: input.newPassword,
    confirmPassword: input.confirmPassword,
  });
}
