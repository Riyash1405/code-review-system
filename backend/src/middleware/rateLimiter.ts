import rateLimit from 'express-rate-limit';

// Standard headers are returned in responses:
// RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset

// 1. Auth Login: 5 requests per 15 minutes
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Auth Register: 3 requests per hour
export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many accounts created from this IP. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Forgot Password: 3 requests per hour
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many password reset requests. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Global API Limiter: 100 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many API requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 5. Analysis Trigger Limiter: 10 requests per hour per user
export const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  // Custom key generator using the user ID instead of IP, since this is an authenticated route
  keyGenerator: (req) => {
    return req.user?.id || 'unauthenticated';
  },
  message: { error: 'Analysis quota exceeded (max 10 per hour). Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
