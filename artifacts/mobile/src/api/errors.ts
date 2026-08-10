import { ApiError, AuthSessionError, OfflineMutationError } from './client';

export interface NormalizedApiError {
  kind: 'api' | 'auth' | 'offline' | 'network' | 'unknown';
  message: string;
  status?: number;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (error instanceof AuthSessionError) {
    return { kind: 'auth', message: 'Sua sessao expirou. Entre novamente.', status: 401 };
  }
  if (error instanceof OfflineMutationError) {
    return { kind: 'offline', message: error.message };
  }
  if (error instanceof ApiError) {
    return {
      kind: error.status === 0 ? 'network' : 'api',
      message: error.message,
      status: error.status || undefined,
    };
  }
  if (error instanceof Error) return { kind: 'unknown', message: error.message };
  return { kind: 'unknown', message: 'Nao foi possivel concluir a operacao.' };
}

