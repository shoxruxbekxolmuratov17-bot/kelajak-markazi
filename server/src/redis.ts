/**
 * Redis client with in-memory fallback (works without Docker).
 * Used for rate-limit, OTP TTL, and simple queues.
 */
type Entry = { value: string; expiresAt?: number };

const memory = new Map<string, Entry>();

let redis: {
  get: (k: string) => Promise<string | null>;
  set: (k: string, v: string, mode?: string, ttl?: number) => Promise<void>;
  incr: (k: string) => Promise<number>;
  expire: (k: string, sec: number) => Promise<void>;
  del: (k: string) => Promise<void>;
  lpush: (k: string, v: string) => Promise<void>;
  rpop: (k: string) => Promise<string | null>;
} | null = null;

let mode: 'redis' | 'memory' = 'memory';

function memGet(k: string) {
  const e = memory.get(k);
  if (!e) return null;
  if (e.expiresAt && Date.now() > e.expiresAt) {
    memory.delete(k);
    return null;
  }
  return e.value;
}

export async function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    mode = 'memory';
    return mode;
  }
  try {
    const mod = await import('redis').catch(() => null);
    if (!mod) {
      mode = 'memory';
      return mode;
    }
    const client = mod.createClient({
      url,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: false,
      },
    });
    client.on('error', () => {
      /* fallback stays */
    });
    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connect timeout')), 2500)
      ),
    ]);
    redis = {
      get: (k) => client.get(k),
      set: async (k, v, modeArg, ttl) => {
        if (modeArg === 'EX' && ttl) await client.set(k, v, { EX: ttl });
        else await client.set(k, v);
      },
      incr: (k) => client.incr(k),
      expire: async (k, sec) => {
        await client.expire(k, sec);
      },
      del: async (k) => {
        await client.del(k);
      },
      lpush: async (k, v) => {
        await client.lPush(k, v);
      },
      rpop: (k) => client.rPop(k),
    };
    mode = 'redis';
  } catch {
    mode = 'memory';
  }
  return mode;
}

export function cacheMode() {
  return mode;
}

export async function cacheGet(key: string) {
  if (redis) return redis.get(key);
  return memGet(key);
}

export async function cacheSet(key: string, value: string, ttlSec?: number) {
  if (redis) {
    if (ttlSec) await redis.set(key, value, 'EX', ttlSec);
    else await redis.set(key, value);
    return;
  }
  memory.set(key, {
    value,
    expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : undefined,
  });
}

export async function cacheIncr(key: string, ttlSec?: number) {
  if (redis) {
    const n = await redis.incr(key);
    if (ttlSec && n === 1) await redis.expire(key, ttlSec);
    return n;
  }
  const cur = Number(memGet(key) || '0') + 1;
  memory.set(key, {
    value: String(cur),
    expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : memory.get(key)?.expiresAt,
  });
  return cur;
}

export async function cacheDel(key: string) {
  if (redis) await redis.del(key);
  else memory.delete(key);
}

export async function queuePush(queue: string, payload: string) {
  if (redis) await redis.lpush(queue, payload);
  else {
    const k = `q:${queue}`;
    const raw = memGet(k);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    arr.unshift(payload);
    memory.set(k, { value: JSON.stringify(arr) });
  }
}

export async function queuePop(queue: string) {
  if (redis) return redis.rpop(queue);
  const k = `q:${queue}`;
  const raw = memGet(k);
  if (!raw) return null;
  const arr = JSON.parse(raw) as string[];
  const v = arr.pop() ?? null;
  memory.set(k, { value: JSON.stringify(arr) });
  return v;
}
