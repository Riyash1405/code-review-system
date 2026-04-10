import 'dotenv/config';
import app from './app';
import db from './config/db';
import { analysisWorker } from './workers/analysisWorker.js';

analysisWorker.on('ready', () => {
  console.log('👷 Analysis Worker is ready and listening for jobs!');
});
analysisWorker.on('error', (err) => {
  console.error('👷 Analysis Worker encountered an error:', err);
});

const PORT = 3001;

const startServer = async () => {
  try {
    await db.$connect();
    console.log('✅ Connected to the database successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
