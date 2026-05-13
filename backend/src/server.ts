import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import app from './app.js';
import db from './config/db.js';
import { analysisWorker } from './workers/analysisWorker.js';

analysisWorker.on('ready', () => {
  logger.info('👷 Analysis Worker is ready and listening for jobs');
});
analysisWorker.on('error', (err) => {
  logger.error({ err }, '👷 Analysis Worker encountered an error');
});

const PORT = env.PORT;

const startServer = async () => {
  try {
    await db.$connect();
    logger.info('✅ Connected to the database successfully');

    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.fatal({ err: error }, '❌ Failed to connect to the database');
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  await analysisWorker.close();
  await db.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
