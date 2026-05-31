type CacheEntry<T> = {
  promise?: Promise<T>;
  value?: T;
  expiresAt: number;
};

const requestCache = new Map<string, CacheEntry<unknown>>();

export function cachedRequest<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = requestCache.get(key);

  if (existing?.value !== undefined && existing.expiresAt > now) {
    return Promise.resolve(existing.value as T);
  }

  if (existing?.promise) {
    return existing.promise as Promise<T>;
  }

  const promise = loader()
    .then((value) => {
      requestCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
      return value;
    })
    .catch((error) => {
      const current = requestCache.get(key);
      if (current?.promise === promise) {
        requestCache.delete(key);
      }
      throw error;
    });

  requestCache.set(key, {
    promise,
    expiresAt: now + ttlMs,
  });

  return promise;
}

export function invalidateRequestCache(keyPrefix?: string) {
  if (!keyPrefix) {
    requestCache.clear();
    return;
  }

  for (const key of requestCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      requestCache.delete(key);
    }
  }
}