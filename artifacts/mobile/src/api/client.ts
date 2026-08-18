import * as storage from '@/src/utils/secureStorage';
import NetInfo from '@react-native-community/netinfo';
import { buildClientHeaders } from '@/src/api/clientHeaders';

export const KEYS = {
  ACCESS_TOKEN: 'gtf_access_token',
  REFRESH_TOKEN: 'gtf_refresh_token',
};

const DEFAULT_PUBLIC_API_URL = 'https://propostasmosaico-one.vercel.app/api';

export function getApiBaseUrl(env: { [key: string]: string | undefined }): string {
  const explicitUrl = env.EXPO_PUBLIC_API_URL?.trim();
  if (explicitUrl) return explicitUrl.replace(/\/+$/, '');

  const domain = env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain.replace(/\/+$/, '')}/api`;

  return DEFAULT_PUBLIC_API_URL;
}

function getBaseUrl(): string {
  return getApiBaseUrl(process.env);
}

export async function getAccessToken(): Promise<string | null> {
  return storage.getItem(KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return storage.getItem(KEYS.REFRESH_TOKEN);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    storage.setItem(KEYS.ACCESS_TOKEN, access),
    storage.setItem(KEYS.REFRESH_TOKEN, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    storage.deleteItem(KEYS.ACCESS_TOKEN).catch(() => {}),
    storage.deleteItem(KEYS.REFRESH_TOKEN).catch(() => {}),
  ]);
}

export interface ApiErrorPayload {
  message: string;
  code?: string;
  blockers?: Record<string, number>;
  fields?: unknown;
  requiresConfirmation?: boolean;
  [key: string]: unknown;
}

export function parseApiErrorPayload(status: number, data: unknown): ApiErrorPayload {
  const raw = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const errorValue = raw.error;
  const nested = errorValue && typeof errorValue === 'object' ? errorValue as Record<string, unknown> : undefined;
  const message = String(
    nested?.message ??
      (typeof errorValue === 'string' ? errorValue : undefined) ??
      raw.message ??
      `Erro ${status}`,
  );
  return {
    ...raw,
    ...(nested ?? {}),
    message,
    code: typeof raw.code === 'string' ? raw.code : typeof nested?.code === 'string' ? nested.code : undefined,
    blockers: (raw.blockers ?? nested?.blockers) as Record<string, number> | undefined,
    fields: raw.fields ?? nested?.fields,
    requiresConfirmation: Boolean(raw.requiresConfirmation ?? nested?.requiresConfirmation),
  };
}

export class ApiError extends Error {
  readonly code?: string;
  readonly fieldErrors?: unknown;
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload: ApiErrorPayload = { message },
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.fieldErrors = payload.fields;
  }
}

export class AuthSessionError extends Error {
  constructor() {
    super('Sessão expirada. Faça login novamente.');
    this.name = 'AuthSessionError';
  }
}

export class OfflineMutationError extends Error {
  constructor() {
    super('Sem conexao. Reconecte-se para salvar alteracoes.');
    this.name = 'OfflineMutationError';
  }
}

let sessionExpiredHandler: (() => void | Promise<void>) | null = null;

export function setSessionExpiredHandler(handler: (() => void | Promise<void>) | null) {
  sessionExpiredHandler = handler;
}

// Single-flight refresh: only one refresh in-flight at a time
let _refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await fetch(`${getBaseUrl()}/auth/mobile/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      if ([400, 401, 403].includes(response.status)) {
        await clearTokens();
        return null;
      }
      throw new ApiError(response.status, 'Nao foi possivel renovar a sessao.');
    }
    const data = await response.json();
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (error) {
    throw new ApiError(0, error instanceof Error ? error.message : 'Falha de conexao');
  }
}

function refreshOnce(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = performRefresh().finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function doFetch(
  method: HttpMethod,
  path: string,
  body: unknown,
  token: string | null,
): Promise<Response> {
  const headers = buildClientHeaders(token);

  return fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined && method !== 'GET' && method !== 'DELETE' ? JSON.stringify(body) : undefined,
  });
}

export async function apiCall<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  if (method !== 'GET') {
    const network = await NetInfo.fetch();
    if (network.isConnected === false || network.isInternetReachable === false) {
      throw new OfflineMutationError();
    }
  }

  let token = await getAccessToken();
  let response = await doFetch(method, path, body, token);

  if (response.status === 401) {
    const newToken = await refreshOnce();
    if (!newToken) {
      await sessionExpiredHandler?.();
      throw new AuthSessionError();
    }
    response = await doFetch(method, path, body, newToken);
    if (response.status === 401) {
      await clearTokens();
      await sessionExpiredHandler?.();
      throw new AuthSessionError();
    }
  }

  if (!response.ok) {
    let payload: ApiErrorPayload = { message: `Erro ${response.status}` };
    try {
      const data = await response.json();
      payload = parseApiErrorPayload(response.status, data);
    } catch {}
    throw new ApiError(response.status, payload.message, payload);
  }

  if (response.status === 204) return null as T;

  const text = await response.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}
