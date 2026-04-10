import { Worker, Job } from 'bullmq';
import db from '../config/db';
import { GitHubFetcher } from '../services/githubFetcher';
import { CodeAnalyzer } from '../analyzers/index';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new URL(redisUrl);

export const analysisWorker = new Worker(
  'analysisQueue',
  async (job: Job) => {
    const { repoId, commitSha } = job.data;
    console.log(`Starting analysis for repo ${repoId} at commit ${commitSha}`);

    const dbJob = await db.job.findUnique({
      where: { id: job.data.dbJobId },
      include: { repository: { include: { owner: true } } }
    });

    if (!dbJob) return;

    await db.job.update({
      where: { id: dbJob.id },
      data: { status: 'RUNNING' },
    });

    try {
      const accessToken = dbJob.repository.owner.accessToken;
      const owner = dbJob.repository.fullName.split('/')[0];
      const repo = dbJob.repository.name;

      // 1. Fetch Source Code
      const fetcher = new GitHubFetcher(accessToken);
      const files = await fetcher.fetchRepoSourceCode(owner, repo, commitSha);

      // 2. Analyze Code
      const analyzer = new CodeAnalyzer();
      const analysisOptions = {
        useLlm: dbJob.repository.owner.useLlmForReview,
        apiKey: dbJob.repository.owner.geminiApiKey || undefined
      };
      const analysisResult = await analyzer.analyze(files, analysisOptions);

      // 3. Upsert Commit
      const commit = await db.commit.upsert({
        where: { sha: commitSha },
        create: {
          sha: commitSha,
          message: 'Job Triggered Analysis Commit', // Needs webhook sync for better message later
          author: dbJob.repository.owner.username,
          repositoryId: repoId,
        },
        update: {},
      });

      // 4. Save Analysis Result
      await db.analysisResult.upsert({
        where: { commitId: commit.id },
        update: {
          score: analysisResult.score,
          issues: analysisResult.issues as any,
          summary: analysisResult.summary,
        },
        create: {
          commitId: commit.id,
          score: analysisResult.score,
          issues: analysisResult.issues as any,
          summary: analysisResult.summary,
        },
      });
      
      // 5. Post PR Comment via GitHub API if this is a PR
      if (job.data.prNumber) {
        try {
          const axios = require('axios');
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
          console.log(`Posted PR comment to ${owner}/${repo}#${job.data.prNumber}`);
        } catch (commentErr: any) {
          console.error(`Failed to post PR comment to ${owner}/${repo}#${job.data.prNumber}:`, commentErr?.response?.data || commentErr.message);
        }
      }

      console.log(`Completed analysis for repo ${repoId} at commit ${commitSha}`);

      await db.job.update({
        where: { id: dbJob.id },
        data: { status: 'COMPLETED' },
      });
    } catch (error: any) {
      console.error(`Analysis failed for ${repoId} at ${commitSha}:`, error);

      // Create a dummy commit record if it didn't exist so we can attach the error result
      const commit = await db.commit.upsert({
        where: { sha: commitSha },
        create: {
          sha: commitSha,
          message: 'Failed Analysis Commit',
          author: dbJob.repository?.owner?.username || 'Unknown',
          repositoryId: repoId,
        },
        update: {},
      });

      // Save a 0/100 score for immediate feedback
      await db.analysisResult.upsert({
        where: { commitId: commit.id },
        update: {
          score: 0,
          issues: [{ type: 'ERROR', message: error.message || 'Unknown failure' }] as any,
          summary: 'Analysis Failed: ' + (error.message || 'Worker crash'),
        },
        create: {
          commitId: commit.id,
          score: 0,
          issues: [{ type: 'ERROR', message: error.message || 'Unknown failure' }] as any,
          summary: 'Analysis Failed: ' + (error.message || 'Worker crash'),
        },
      });

      await db.job.update({
        where: { id: dbJob.id },
        data: { status: 'FAILED', error: error.message },
      });
    }
  },
  {
    connection: { host: connection.hostname, port: Number(connection.port) },
  }
);
