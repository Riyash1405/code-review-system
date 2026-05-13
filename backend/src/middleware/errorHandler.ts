import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Global Express error handling middleware.
 * Catches all errors (AppError and unknown) and formats a consistent JSON response.
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, 'Non-operational error occurred');
    } else {
      logger.warn({ err: err.message }, 'Operational error');
    }

    return res.status(err.statusCode).json({
      error: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle generic / unhandled errors
  logger.error({ err }, 'Unhandled error');
  return res.status(500).json({
    error: 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { message: err.message, stack: err.stack }),
  });
};
