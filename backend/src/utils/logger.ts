import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Structured logger for the application.
 *
 * - Development: pretty-printed, colorized output
 * - Production: JSON lines for log aggregation (ELK, Datadog, etc.)
 *
 * @example
 *   import { logger } from '../utils/logger.js';
 *   logger.info('Server started');
 *   logger.error({ err }, 'Request failed');
 */
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
      : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
