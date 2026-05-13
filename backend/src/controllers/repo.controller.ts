import { Request, Response } from 'express';
import axios from 'axios';
import { GitHubService } from '../services/github.service.js';
import db from '../config/db.js';
import { AnalysisResult, Commit } from '../generated/prisma/index.js';
import { addAnalysisJob } from '../queue/analysisQueue.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, UnauthorizedError, ConflictError, ForbiddenError } from '../utils/errors.js';
import asyncHandler from 'express-async-handler';
import type { GitHubRepoResponse, AnalysisOutput } from '../types/index.js';

/**
 * Get repos from ALL connected GitHub accounts
 */
export const getRepositories = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user.githubAccounts?.length) {
    res.json({ repos: [], message: 'No GitHub accounts connected. Go to Settings to link one.' });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;

  const allRepos: (GitHubRepoResponse & { _githubAccountId: string; _githubUsername: string })[] = [];
  for (const account of user.githubAccounts) {
    try {
      const githubService = new GitHubService(account.accessToken);
      const repos = (await githubService.getUserRepositories()) as GitHubRepoResponse[];
      // Tag each repo with the GitHub account info
      const taggedRepos = repos.map((r) => ({
        ...r,
        _githubAccountId: account.id,
        _githubUsername: account.username,
      }));
      allRepos.push(...taggedRepos);
    } catch (err: unknown) {
      logger.warn(
        { err },
        `Failed to fetch repos for GitHub account @${account.username}`
      );
    }
  }

  // Sort by updated_at descending before pagination
  allRepos.sort((a, b) => new Date(String(b.updated_at)).getTime() - new Date(String(a.updated_at)).getTime());

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedRepos = allRepos.slice(startIndex, endIndex);

  res.json({
    repos: paginatedRepos,
    pagination: {
      page,
      limit,
      totalCount: allRepos.length,
      totalPages: Math.ceil(allRepos.length / limit)
    }
  });
});

export const getRepositoryDetails = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const owner = String(req.params.owner);
  const repo = String(req.params.repo);

  if (!user.accessToken) {
    throw new UnauthorizedError('No GitHub account connected');
  }

  // Find the right token for this repo owner
  const account = user.githubAccounts?.find((a) => a.username === owner) || user.githubAccounts?.[0];
  const token = account?.accessToken || user.accessToken;

  const githubService = new GitHubService(token);
  const repoDetails = await githubService.getRepository(owner, repo) as GitHubRepoResponse;

  const dbRepo = await db.repository.findUnique({
    where: { githubRepoId: repoDetails.id }
  });

  let recentAnalyses: (AnalysisResult & { commit: Commit })[] = [];
  if (dbRepo) {
    recentAnalyses = await db.analysisResult.findMany({
      where: { commit: { repositoryId: dbRepo.id } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { commit: true }
    });
  }

  res.json({
    details: repoDetails,
    recentAnalyses,
    isTracked: !!dbRepo
  });
});

export const getCommits = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const owner = String(req.params.owner);
  const repo = String(req.params.repo);

  if (!user.accessToken) {
    throw new UnauthorizedError('No GitHub account connected');
  }

  const account = user.githubAccounts?.find((a) => a.username === owner) || user.githubAccounts?.[0];
  const token = account?.accessToken || user.accessToken;

  const githubService = new GitHubService(token);
  const commits = await githubService.getRepoCommits(owner, repo);

  res.json({ commits });
});

export const getAnalysisResult = asyncHandler(async (req: Request, res: Response) => {
  const commitSha = String(req.params.commitSha);
  
  const analysis = await db.analysisResult.findUnique({
    where: { commitId: commitSha },
  });

  if (!analysis) {
     const commit = await db.commit.findUnique({
         where: { sha: commitSha },
         include: { analysisResult: true }
     });
     if (commit && commit.analysisResult) {
         res.json({ analysis: commit.analysisResult });
         return;
     }
     throw new NotFoundError('Analysis not found');
  }

  res.json({ analysis });
});

export const triggerAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const owner = String(req.params.owner);
  const repo = String(req.params.repo);

  if (!user.accessToken) {
    throw new UnauthorizedError('No GitHub account connected');
  }

  // Find the right GitHub account for this repo
  const account = user.githubAccounts?.find((a) => a.username === owner) || user.githubAccounts?.[0];
  const token = account?.accessToken || user.accessToken;
  const ghAccountId = account?.id || user.githubAccounts?.[0]?.id;

  if (!ghAccountId) {
    throw new NotFoundError('No GitHub account linked. Connect one in Settings.');
  }

  const githubService = new GitHubService(token);
  const repoDetails = await githubService.getRepository(owner, repo) as GitHubRepoResponse;
  
  let commitSha = req.body.commitSha as string | undefined;
  const forceReanalyze = req.body.force === true;
  
  if (!commitSha) {
    const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches/${repoDetails.default_branch}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      }
    });
    commitSha = branchRes.data.commit.sha as string;
  }

  // Sync Repository — now linked to GitHubAccount
  const dbRepo = await db.repository.upsert({
    where: { githubRepoId: repoDetails.id },
    create: {
      githubRepoId: repoDetails.id,
      name: repoDetails.name,
      fullName: repoDetails.full_name,
      githubAccountId: ghAccountId,
    },
    update: {
      name: repoDetails.name,
      fullName: repoDetails.full_name,
    }
  });

  // Cache check
  const existingCommit = await db.commit.findUnique({
    where: { sha: commitSha },
    include: { analysisResult: true }
  });

  if (existingCommit && existingCommit.analysisResult) {
    // Check if it's a dummy/failed result
    // The DB JSON field is unknown to TS, so we cast to AnalysisOutput.issues
    const issues = existingCommit.analysisResult.issues as unknown as AnalysisOutput['issues'];
    const isFailed = existingCommit.analysisResult.score === 0 && Array.isArray(issues) && issues.length === 1 && issues[0]?.type === 'ERROR';
    
    if (isFailed || forceReanalyze) {
      logger.info(`${forceReanalyze ? 'Force re-analysis' : 'Failed run detected'} for ${commitSha}. Deleting old result...`);
      await db.analysisResult.delete({ where: { id: existingCommit.analysisResult.id } });
    } else {
      res.json({
        message: 'Analysis already exists for this commit (cached)',
        commitSha,
        cached: true,
        analysis: existingCommit.analysisResult,
      });
      return;
    }
  }

  const job = await db.job.create({
    data: {
      repositoryId: dbRepo.id,
      commitSha,
      status: 'PENDING',
      type: 'FULL_REPO'
    }
  });

  await addAnalysisJob(dbRepo.id, commitSha, job.id);
  res.json({ message: 'Analysis triggered successfully', jobId: job.id, commitSha });
});

/**
 * Get recent analyses across all repos for the current user (for notifications)
 */
export const getRecentAnalyses = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user.githubAccounts?.length) {
    res.json({ analyses: [] });
    return;
  }

  const accountIds = user.githubAccounts.map((a) => a.id);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;

  const whereClause = {
    commit: {
      repository: {
        githubAccountId: { in: accountIds }
      }
    }
  };

  const totalCount = await db.analysisResult.count({ where: whereClause });

  const analyses = await db.analysisResult.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      commit: {
        include: {
          repository: {
            select: { name: true, fullName: true }
          }
        }
      }
    }
  });

  res.json({
    analyses: analyses.map(a => ({
      id: a.id,
      score: a.score,
      summary: a.summary,
      createdAt: a.createdAt,
      commitSha: a.commit.sha,
      repoName: a.commit.repository.name,
      repoFullName: a.commit.repository.fullName,
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
});

/**
 * Retry a completely failed job (DLQ concept)
 */
export const retryJob = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const owner = String(req.params.owner);
  const repo = String(req.params.repo);
  const jobId = String(req.params.jobId);

  // Find the job and verify user access to the repository
  const dbJob = await db.job.findUnique({
    where: { id: jobId },
    include: {
      repository: {
        include: { githubAccount: true }
      }
    }
  });

  if (!dbJob) {
    throw new NotFoundError('Job not found');
  }

  if (dbJob.repository.githubAccount?.userId !== user.id) {
    throw new ForbiddenError('You do not have access to this repository');
  }

  if (dbJob.status !== 'FAILED') {
    throw new ConflictError('Only failed jobs can be retried');
  }

  // Update DB status to PENDING
  await db.job.update({
    where: { id: jobId },
    data: { status: 'PENDING', error: null },
  });

  // Re-add to BullMQ Queue
  await addAnalysisJob(dbJob.repositoryId, dbJob.commitSha, dbJob.id);

  res.json({ message: 'Job retry initiated', jobId: dbJob.id });
});
