import { Queue, QueueOptions } from 'bullmq';
import { env } from '../config/env.js';

const connection = new URL(env.REDIS_URL);

const queueOptions: QueueOptions = {
  connection: {
    host: connection.hostname,
    port: Number(connection.port),
    maxRetriesPerRequest: null, // Recommended by BullMQ for robust connections
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s...
    },
    removeOnComplete: {
      age: 3600, // keep for 1 hour
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 3600, // keep for 24 hours
    },
  },
};

export const analysisQueue = new Queue('analysisQueue', queueOptions);

export const addAnalysisJob = async (repoId: string, commitSha: string, dbJobId: string, prNumber?: number) => {
  return analysisQueue.add('analyze', { repoId, commitSha, dbJobId, prNumber });
};
