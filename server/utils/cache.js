/**
 * Simple in-memory cache for serverless environments
 * Note: This cache is reset on each function invocation
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  set(key, value, ttlMs = 300000) {
    // Default 5 minutes
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now() + ttlMs);
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  has(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return false;
    }
    return this.cache.has(key);
  }
}

// Global cache instance
const cache = new SimpleCache();

/**
 * Cache wrapper for database operations
 */
const withCache = async (key, operation, ttlMs = 300000) => {
  // Check cache first
  const cached = cache.get(key);
  if (cached !== null) {
    console.log(`📦 Cache hit for key: ${key}`);
    return cached;
  }

  console.log(`🔄 Cache miss for key: ${key}, fetching from database`);

  try {
    const result = await operation();
    cache.set(key, result, ttlMs);
    return result;
  } catch (error) {
    console.error(`❌ Cache operation failed for key: ${key}`, error);
    throw error;
  }
};

/**
 * Invalidate cache entries by pattern
 */
const invalidateCache = (pattern) => {
  const regex = new RegExp(pattern);
  let invalidated = 0;

  for (const key of cache.cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      invalidated++;
    }
  }

  console.log(
    `🗑️ Invalidated ${invalidated} cache entries matching pattern: ${pattern}`
  );
  return invalidated;
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const [key, timestamp] of cache.timestamps.entries()) {
    if (now > timestamp) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  }

  return {
    total: cache.cache.size,
    valid: validEntries,
    expired: expiredEntries,
  };
};

module.exports = {
  cache,
  withCache,
  invalidateCache,
  getCacheStats,
};
