// In-memory nonce store for Cap Core (for demo).
// For production, swap to Redis, Upstash, or a DB with TTL.
const store = new Map<string, number>();

export function consumeNonce(sigHex: string, ttlMs: number): boolean {
  if (store.has(sigHex)) return false;
  store.set(sigHex, Date.now() + ttlMs);
  setTimeout(() => store.delete(sigHex), ttlMs);
  return true;
}

export function tokenExists(tokenKey: string): boolean {
  return store.has(tokenKey);
}

export function deleteToken(tokenKey: string): void {
  store.delete(tokenKey);
}
