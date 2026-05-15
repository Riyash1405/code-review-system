import 'dotenv/config';
import { z } from 'zod';

/**
 * Zod schema for all environment variables.
 * Validates presence and format on startup — no silent fallbacks.
 */
const envSchema = z.object({
  // ─── Core ─────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // ─── Database ─────────────────────────────────────────────────
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),

  // ─── Redis ────────────────────────────────────────────────────
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),

  // ─── Auth ─────────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),

  // ─── GitHub OAuth ─────────────────────────────────────────────
  GITHUB_CLIENT_ID: z.string().min(1, 'GITHUB_CLIENT_ID is required'),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),
  GITHUB_CALLBACK_URL: z.string().url('GITHUB_CALLBACK_URL must be a valid URL'),
  GITHUB_WEBHOOK_SECRET: z.string().min(1, 'GITHUB_WEBHOOK_SECRET is required'),

  // ─── Frontend ─────────────────────────────────────────────────
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').default('http://localhost:5173'),

  // ─── Encryption ───────────────────────────────────────────────
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)'),

  // ─── SMTP (optional — graceful fallback if not set) ───────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('\n╔══════════════════════════════════════════╗');
    console.error('║   MISSING OR INVALID ENV VARIABLES       ║');
    console.error('╠══════════════════════════════════════════╣');
    console.error(formatted);
    console.error('╚══════════════════════════════════════════╝\n');
    console.error('Copy backend/.env.example to backend/.env and fill in all required values.\n');

    process.exit(1);
  }

  return result.data;
}

/**
 * Validated, typed environment variables.
 * Import this instead of using process.env directly.
 *
 * In test environments, validation is skipped so unit tests don't need
 * a real .env file. The test-setup.ts file provides safe dummy values.
 *
 * @example
 *   import { env } from '../config/env.js';
 *   const secret = env.JWT_SECRET;
 */
const isTest = process.env.NODE_ENV === 'test';

export const env: Env = isTest
  ? (process.env as unknown as Env)
  : validateEnv();
