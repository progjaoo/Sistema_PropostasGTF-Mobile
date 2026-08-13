export function buildClientHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Platform': 'mobile',
    'X-Client-Version': '1.0.0',
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
