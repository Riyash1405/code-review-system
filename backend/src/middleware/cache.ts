import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const redisClient = createClient({ url: env.REDIS_URL });

redisClient.on('error', (err) => logger.error({ err }, 'Redis Client Error'));

// Connect automatically
redisClient.connect().catch((err) => logger.error({ err }, 'Redis connection failed'));

export const cacheMiddleware = (durationInSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Bypass cache if consumer explicitly asks for it
    if (req.headers['cache-control'] === 'no-cache' || req.query.nocache === 'true') {
      return next();
    }

    // Creating a unique key based on URL and user token (so users don't see each other's repos)
    const userId = req.user ? req.user.id : 'anonymous';
    const key = `cache:${userId}:${req.originalUrl}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      } else {
        // Intercept res.json to cache the response before sending
        const originalJson = res.json.bind(res);
        res.json = (body: unknown) => {
          // Fire and forget caching
          redisClient.setEx(key, durationInSeconds, JSON.stringify(body)).catch((err) =>
            logger.error({ err }, 'Redis cache write failed'),
          );
          return originalJson(body);
        };
        next();
      }
    } catch (error) {
      logger.error({ err: error }, 'Redis cache error');
      next(); // Fail silently and proceed without cache
    }
  };
};
