import { Request, Response } from 'express';
import { GitHubService } from '../services/github.service.js';
import db from '../config/db.js';
import { AnalysisResult, Commit } from '../generated/prisma/index.js';
import { addAnalysisJob } from '../queue/analysisQueue.js';

/**
 * Get repos from ALL connected GitHub accounts
 */
export const getRepositories = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user?.githubAccounts?.length) {
      return res.json({ repos: [], message: 'No GitHub accounts connected. Go to Settings to link one.' });
    }

    let allRepos: any[] = [];
    for (const account of user.githubAccounts) {
      try {
        const githubService = new GitHubService(account.accessToken);
        const repos = await githubService.getUserRepositories();
        // Tag each repo with the GitHub account info
        const taggedRepos = repos.map((r: any) => ({
          ...r,
          _githubAccountId: account.id,
          _githubUsername: account.username,
        }));
        allRepos.push(...taggedRepos);
      } catch (err: any) {
        console.warn(`Failed to fetch repos for GitHub account @${account.username}:`, err.message);
      }
    }

    res.json({ repos: allRepos });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
};

export const getRepositoryDetails = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const owner = String(req.params.owner);
    const repo = String(req.params.repo);

    if (!user?.accessToken) {
      return res.status(401).json({ error: 'No GitHub account connected' });
    }

    // Find the right token for this repo owner
    const account = user.githubAccounts?.find((a: any) => a.username === owner) ||
                    user.githubAccounts?.[0];
    const token = account?.accessToken || user.accessToken;

    const githubService = new GitHubService(token);
    const repoDetails = await githubService.getRepository(owner, repo);

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
  } catch (error) {
    console.error('Error fetching repository details:', error);
    res.status(500).json({ error: 'Failed to fetch repository details' });
  }
};

export const getCommits = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const owner = String(req.params.owner);
    const repo = String(req.params.repo);

    if (!user?.accessToken) {
      return res.status(401).json({ error: 'No GitHub account connected' });
    }

    const account = user.githubAccounts?.find((a: any) => a.username === owner) ||
                    user.githubAccounts?.[0];
    const token = account?.accessToken || user.accessToken;

    const githubService = new GitHubService(token);
    const commits = await githubService.getRepoCommits(owner, repo);

    res.json({ commits });
  } catch (error) {
    console.error('Error fetching commits:', error);
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
};

export const getAnalysisResult = async (req: Request, res: Response) => {
  try {
    const commitSha = String(req.params.commitSha);
    
    let analysis = await db.analysisResult.findUnique({
      where: { commitId: commitSha },
    });

    if (!analysis) {
       const commit = await db.commit.findUnique({
           where: { sha: commitSha },
           include: { analysisResult: true }
       });
       if (commit && commit.analysisResult) {
           return res.json({ analysis: commit.analysisResult });
       }
       return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Error fetching analysis result:', error);
    res.status(500).json({ error: 'Failed to fetch analysis details' });
  }
};

export const triggerAnalysis = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const owner = String(req.params.owner);
    const repo = String(req.params.repo);

    if (!user?.accessToken) {
      return res.status(401).json({ error: 'No GitHub account connected' });
    }

    // Find the right GitHub account for this repo
    const account = user.githubAccounts?.find((a: any) => a.username === owner) ||
                    user.githubAccounts?.[0];
    const token = account?.accessToken || user.accessToken;
    const ghAccountId = account?.id || user.githubAccounts?.[0]?.id;

    if (!ghAccountId) {
      return res.status(400).json({ error: 'No GitHub account linked. Connect one in Settings.' });
    }

    const githubService = new GitHubService(token);
    const repoDetails = await githubService.getRepository(owner, repo);
    
    let commitSha = req.body.commitSha;
    const forceReanalyze = req.body.force === true;
    
    if (!commitSha) {
      const axios = require('axios');
      const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches/${repoDetails.default_branch}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        }
      });
      commitSha = branchRes.data.commit.sha;
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
      const issues = existingCommit.analysisResult.issues as any[];
      const isFailed = existingCommit.analysisResult.score === 0 && issues?.length === 1 && issues[0]?.type === 'ERROR';
      
      if (isFailed || forceReanalyze) {
        console.log(`${forceReanalyze ? 'Force re-analysis' : 'Failed run detected'} for ${commitSha}. Deleting old result...`);
        await db.analysisResult.delete({ where: { id: existingCommit.analysisResult.id } });
      } else {
        return res.json({
          message: 'Analysis already exists for this commit (cached)',
          commitSha,
          cached: true,
          analysis: existingCommit.analysisResult,
        });
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
  } catch (error) {
    console.error('Error triggering analysis:', error);
    res.status(500).json({ error: 'Failed to trigger analysis' });
  }
};

/**
 * Get recent analyses across all repos for the current user (for notifications)
 */
export const getRecentAnalyses = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user?.githubAccounts?.length) {
      return res.json({ analyses: [] });
    }

    const accountIds = user.githubAccounts.map((a: any) => a.id);

    const analyses = await db.analysisResult.findMany({
      where: {
        commit: {
          repository: {
            githubAccountId: { in: accountIds }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
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
      }))
    });
  } catch (error) {
    console.error('Error fetching recent analyses:', error);
    res.status(500).json({ error: 'Failed to fetch recent analyses' });
  }
};
