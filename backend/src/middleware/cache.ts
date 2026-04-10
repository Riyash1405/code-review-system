import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect automatically
redisClient.connect().catch(console.error);

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
    const user = req.user as any;
    const userId = user ? user.id : 'anonymous';
    const key = `cache:${userId}:${req.originalUrl}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      } else {
        // Intercept res.json to cache the response before sending
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
          // Fire and forget caching
          redisClient.setEx(key, durationInSeconds, JSON.stringify(body)).catch(console.error);
          return originalJson(body);
        };
        next();
      }
    } catch (error) {
      console.error('Redis cache error:', error);
      next(); // Fail silently and proceed without cache
    }
  };
};
