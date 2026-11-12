import Redis, { RedisOptions } from "ioredis";

// Global cache for Next.js hot reload in development
declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | null | undefined;
}

const REDIS_CONNECTION_URL = process.env.VALKEY_URL || process.env.REDIS_URL;

function createRedisClient(): Redis | null {
  if (!REDIS_CONNECTION_URL) {
    return null;
  }

  try {
    const options: RedisOptions = {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2500,
      enableOfflineQueue: false, // Don't hang requests when disconnected; fail fast to PostgreSQL
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop reconnecting after 3 failed attempts
        return Math.min(times * 200, 1000);
      },
    };

    const client = new Redis(REDIS_CONNECTION_URL, options);

    client.on("error", (err) => {
      // Log connection error quietly without crashing the application
      if (process.env.NODE_ENV !== "test") {
        console.warn("⚠️ [Redis] Connection warning (falling back to database):", err?.message || err);
      }
    });

    return client;
  } catch (err: any) {
    console.warn("⚠️ [Redis] Failed to initialize client:", err?.message || err);
    return null;
  }
}

// Preserve client across module reloads in Next.js development
export const redis: Redis | null =
  globalThis.__redisClient ?? (globalThis.__redisClient = createRedisClient());

/**
 * Returns true if Redis is configured with an environment URL.
 */
export function isRedisConfigured(): boolean {
  return Boolean(REDIS_CONNECTION_URL && redis);
}

/**
 * Retrieve a JSON-parsed cached item by key.
 * Returns null on cache miss, unconfigured Redis, or connection failure.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    if (redis.status === "wait") {
      await redis.connect().catch(() => null);
    }
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    return null; // Graceful degradation to PostgreSQL
  }
}

/**
 * Store a value as a JSON string with a Time-To-Live (TTL) in seconds.
 * Returns true on success, false on failure or unconfigured Redis.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 86400
): Promise<boolean> {
  if (!redis) return false;

  try {
    if (redis.status === "wait") {
      await redis.connect().catch(() => null);
    }
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (err) {
    return false; // Non-fatal cache failure
  }
}

/**
 * Delete a cached key.
 */
export async function cacheDel(key: string): Promise<boolean> {
  if (!redis) return false;

  try {
    if (redis.status === "wait") {
      await redis.connect().catch(() => null);
    }
    await redis.del(key);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Builds a deterministic, normalized query key from an object of query parameters.
 * Example: buildQueryHashKey("schemes:search", { state: "Madhya Pradesh", category: "Agriculture" })
 * -> "schemes:search:category=agriculture:state=madhya pradesh"
 */
export function buildQueryHashKey(
  prefix: string,
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const sortedKeys = Object.keys(params).sort();
  const segments = sortedKeys.map((key) => {
    const val = params[key];
    const normalized =
      val === undefined || val === null
        ? ""
        : String(val).trim().toLowerCase().replace(/\s+/g, " ");
    return `${key}=${normalized}`;
  });

  return `${prefix}:${segments.join(":")}`;
}
