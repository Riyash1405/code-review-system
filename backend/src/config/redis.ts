/**
 * Shared Redis connection options for BullMQ (Queue + Worker).
 *
 * Handles both local Redis (redis://) and Upstash/cloud Redis (rediss://)
 * automatically. The key difference is TLS — Upstash requires it, but
 * local Redis does not. Parsing the URL correctly here fixes the
 * ECONNRESET errors seen when deploying to Render with Upstash.
 */
import { env } from '../config/env.js';

const url = new URL(env.REDIS_URL);
const isTLS = url.protocol === 'rediss:';

export const redisConnection = {
  host: url.hostname,
  port: Number(url.port) || (isTLS ? 6380 : 6379),
  // Upstash requires password auth
  ...(url.password ? { username: url.username || 'default', password: url.password } : {}),
  // Enable TLS for rediss:// (Upstash, Redis Cloud, etc.)
  ...(isTLS ? { tls: {} } : {}),
  // Required by BullMQ — prevents "ERR max number of clients reached" on reconnect
  maxRetriesPerRequest: null,
  // Retry forever on disconnect so the worker survives Render cold restarts
  enableReadyCheck: false,
};
