import { Request, Response } from 'express';
import crypto from 'crypto';
import db from '../config/db.js';
import { addAnalysisJob } from '../queue/analysisQueue.js';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'development_secret';

export const handleGitHubWebhook = async (req: Request, res: Response) => {
  // 1. Verify Signature
  const signature = req.headers['x-hub-signature-256'] as string;
  const event = req.headers['x-github-event'] as string;

  if (!signature) {
    return res.status(401).send('No signature found');
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

  if (signature !== digest) {
    return res.status(401).send('Invalid signature');
  }

  // 2. Process Pull Request Event
  if (event === 'pull_request') {
    const { action, pull_request, repository: ghRepo } = req.body;

    // Only trigger on opened or synchronize (new commits)
    if (action === 'opened' || action === 'synchronize') {
      try {
        const repoFullName = ghRepo.full_name;
        const commitSha = pull_request.head.sha;
        const prNumber = pull_request.number;

        // Find repository in our DB to ensure it's tracked
        const dbRepo = await db.repository.findFirst({
          where: { fullName: repoFullName }
        });

        if (!dbRepo) {
          return res.status(404).send('Repository not tracked in system');
        }

        // Create Job record
        const job = await db.job.create({
          data: {
            repositoryId: dbRepo.id,
            commitSha: commitSha,
            status: 'PENDING',
            type: 'PR_REVIEW',
            prNumber: prNumber
          }
        });

        // Add to Redis Queue
        await addAnalysisJob(dbRepo.id, commitSha, job.id, prNumber);

        return res.status(202).json({ message: 'PR review job queued', jobId: job.id });
      } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).send('Internal Server Error');
      }
    }
  }

  res.status(200).send('Event ignored');
};
