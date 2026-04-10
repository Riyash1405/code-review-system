import { Queue, QueueOptions } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new URL(redisUrl);

const queueOptions: QueueOptions = {
  connection: {
    host: connection.hostname,
    port: Number(connection.port),
  },
};

export const analysisQueue = new Queue('analysisQueue', queueOptions);

export const addAnalysisJob = async (repoId: string, commitSha: string, dbJobId: string, prNumber?: number) => {
  return analysisQueue.add('analyze', { repoId, commitSha, dbJobId, prNumber });
};
