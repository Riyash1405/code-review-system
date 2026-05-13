import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from '../errors.js';

describe('Custom Errors', () => {
  it('AppError should set properties correctly', () => {
    const err = new AppError('Test error', 501, false);
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(501);
    expect(err.isOperational).toBe(false);
    expect(err).toBeInstanceOf(Error);
  });

  it('ValidationError should default to 400', () => {
    const err = new ValidationError('Bad input');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
  });

  it('UnauthorizedError should default to 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized access');
  });

  it('ForbiddenError should default to 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Forbidden access');
  });

  it('NotFoundError should default to 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Resource not found');
  });

  it('ConflictError should default to 409', () => {
    const err = new ConflictError('Already exists');
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Already exists');
  });
});
