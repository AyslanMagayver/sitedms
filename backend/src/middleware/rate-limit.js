export function createRateLimiter({ windowMs, maxRequests, now = Date.now }) {
  const hitsByKey = new Map();

  const cleanup = setInterval(() => {
    const currentTime = now();
    for (const [key, hits] of hitsByKey) {
      if (hits.every((timestamp) => currentTime - timestamp >= windowMs)) hitsByKey.delete(key);
    }
  }, windowMs);
  cleanup.unref();

  return {
    consume(key) {
      const currentTime = now();
      const recentHits = (hitsByKey.get(key) || []).filter((timestamp) => currentTime - timestamp < windowMs);

      if (recentHits.length >= maxRequests) {
        hitsByKey.set(key, recentHits);
        return false;
      }

      recentHits.push(currentTime);
      hitsByKey.set(key, recentHits);
      return true;
    },
    stop() {
      clearInterval(cleanup);
    },
  };
}
