// Web fallback: uses sessionStorage (tokens only last the session)
const PREFIX = '__gtf_secure__';

export async function getItem(key: string): Promise<string | null> {
  try {
    return sessionStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    sessionStorage.setItem(PREFIX + key, value);
  } catch {}
}

export async function deleteItem(key: string): Promise<void> {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {}
}
