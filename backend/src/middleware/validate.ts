import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * Express middleware to validate request bodies, params, and queries using Zod schemas.
 * Throws a typed ValidationError which is caught by the global error handler.
 */
export const validate = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform ZodError into a simpler format for the frontend
        const zodError = error as any;
        const errorMessages = zodError.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new ValidationError(`Validation failed: ${errorMessages}`));
      } else {
        next(error);
      }
    }
  };
};
