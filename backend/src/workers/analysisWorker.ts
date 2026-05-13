import { Worker, Job } from 'bullmq';
import axios from 'axios';
import db from '../config/db.js';
import { GitHubFetcher } from '../services/githubFetcher.js';
import { CodeAnalyzer } from '../analyzers/index.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { decrypt } from '../utils/crypto.js';
import type { AnalysisOutput } from '../types/index.js';

const connection = new URL(env.REDIS_URL);

export const analysisWorker = new Worker(
  'analysisQueue',
  async (job: Job) => {
    const { repoId, commitSha } = job.data;
    logger.info(`Starting analysis for repo ${repoId} at commit ${commitSha}`);

    const dbJob = await db.job.findUnique({
      where: { id: job.data.dbJobId },
      include: { repository: { include: { githubAccount: { include: { user: true } } } } }
    });

    if (!dbJob) return;

    await db.job.update({
      where: { id: dbJob.id },
      data: { status: 'RUNNING' },
    });

    try {
      const ghAccount = dbJob.repository.githubAccount;
      const accessToken = decrypt(ghAccount.accessToken);
      const userSettings = ghAccount.user;
      const owner = dbJob.repository.fullName.split('/')[0];
      const repo = dbJob.repository.name;

      // 1. Fetch Source Code
      const fetcher = new GitHubFetcher(accessToken);
      const files = await fetcher.fetchRepoSourceCode(owner, repo, commitSha);

      // 2. Analyze Code
      const analyzer = new CodeAnalyzer();
      const analysisOptions = {
        useLlm: userSettings.useLlmForReview,
        apiKey: userSettings.geminiApiKey || undefined,
        provider: userSettings.llmProvider || 'gemini',
      };
      const analysisResult = await analyzer.analyze(files, analysisOptions);

      // 3. Upsert Commit
      const commit = await db.commit.upsert({
        where: { sha: commitSha },
        create: {
          sha: commitSha,
          message: 'Job Triggered Analysis Commit',
          author: ghAccount.username,
          repositoryId: repoId,
        },
        update: {},
      });

      // 4. Save Analysis Result
      await db.analysisResult.upsert({
        where: { commitId: commit.id },
        update: {
          score: analysisResult.score,
          issues: analysisResult.issues as unknown as import('@prisma/client').Prisma.InputJsonValue,
          summary: analysisResult.summary,
        },
        create: {
          commitId: commit.id,
          score: analysisResult.score,
          issues: analysisResult.issues as unknown as import('@prisma/client').Prisma.InputJsonValue,
          summary: analysisResult.summary,
        },
      });
      
      // 5. Post PR Comment via GitHub API if this is a PR
      if (job.data.prNumber) {
        try {
          const commentBody = `## 🤖 Intelligent Code Review Complete
**Score:** ${analysisResult.score}/100
**Summary:** ${analysisResult.summary}
          
_Detected ${analysisResult.issues.length} total issues across standard metric checks._`;

          await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/issues/${job.data.prNumber}/comments`,
            { body: commentBody },
            {
              headers: {
                Authorization: `token ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
              }
            }
          );
          logger.info(`Posted PR comment to ${owner}/${repo}#${job.data.prNumber}`);
        } catch (commentErr: unknown) {
          logger.error({ err: commentErr }, `Failed to post PR comment to ${owner}/${repo}#${job.data.prNumber}`);
        }
      }

      logger.info(`Completed analysis for repo ${repoId} at commit ${commitSha}`);

      await db.job.update({
        where: { id: dbJob.id },
        data: { status: 'COMPLETED' },
      });
    } catch (error: unknown) {
      logger.error({ err: error }, `Analysis failed for ${repoId} at ${commitSha}`);

      // Rethrow to let BullMQ handle retries
      throw error;
    }
  },
  {
    connection: { 
      host: connection.hostname, 
      port: Number(connection.port),
      maxRetriesPerRequest: null,
    },
    concurrency: 5,
  }
);

analysisWorker.on('failed', async (job, err) => {
  if (job) {
    logger.error({ err }, `Job ${job.id} failed attempt ${job.attemptsMade}/${job.opts.attempts}`);
    
    // If all retries are exhausted, mark as FAILED in DB (Dead Letter Queue concept)
    if (job.attemptsMade >= (job.opts.attempts || 1)) {
      const { repoId, commitSha, dbJobId } = job.data;
      
      try {
        const errorMessage = err instanceof Error ? err.message : 'Unknown failure';
        
        // Fetch original job to get author info if needed
        const dbJob = await db.job.findUnique({
          where: { id: dbJobId },
          include: { repository: { include: { githubAccount: true } } }
        });

        const commit = await db.commit.upsert({
          where: { sha: commitSha },
          create: {
            sha: commitSha,
            message: 'Failed Analysis Commit',
            author: dbJob?.repository?.githubAccount?.username || 'Unknown',
            repositoryId: repoId,
          },
          update: {},
        });

        const errorIssues = [{ type: 'ERROR', message: errorMessage }];

        await db.analysisResult.upsert({
          where: { commitId: commit.id },
          update: {
            score: 0,
            issues: errorIssues as unknown as import('@prisma/client').Prisma.InputJsonValue,
            summary: 'Analysis Failed after retries: ' + errorMessage,
          },
          create: {
            commitId: commit.id,
            score: 0,
            issues: errorIssues as unknown as import('@prisma/client').Prisma.InputJsonValue,
            summary: 'Analysis Failed after retries: ' + errorMessage,
          },
        });

        await db.job.update({
          where: { id: dbJobId },
          data: { status: 'FAILED', error: errorMessage },
        });

        logger.info(`Job ${job.id} completely failed. DB updated to FAILED state.`);
      } catch (dbErr) {
        logger.error({ err: dbErr }, `Failed to update DB for failed job ${job.id}`);
      }
    }
  }
});

analysisWorker.on('error', (err) => {
  logger.error({ err }, 'Worker connection or critical error');
});
