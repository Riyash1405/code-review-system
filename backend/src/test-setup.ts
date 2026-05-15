/**
 * Vitest global setup — runs before any test file is imported.
 * Injects dummy environment variables so env.ts validation passes
 * in CI/test environments without a real .env file.
 */

// A valid 64-char hex ENCRYPTION_KEY for tests
const TEST_ENCRYPTION_KEY = 'a'.repeat(64);

Object.assign(process.env, {
  NODE_ENV: 'test',
  PORT: '3001',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test_jwt_secret_that_is_at_least_32_characters_long',
  GITHUB_CLIENT_ID: 'test_github_client_id',
  GITHUB_CLIENT_SECRET: 'test_github_client_secret',
  GITHUB_CALLBACK_URL: 'http://localhost:3001/api/auth/github/callback',
  GITHUB_WEBHOOK_SECRET: 'test_webhook_secret',
  FRONTEND_URL: 'http://localhost:5174',
  ENCRYPTION_KEY: TEST_ENCRYPTION_KEY,
});
