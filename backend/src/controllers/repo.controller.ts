import { Request, Response } from 'express';
import { GitHubService } from '../services/github.service.js';
import db from '../config/db.js';
import { AnalysisResult, Commit } from '../generated/prisma/index.js';
import { addAnalysisJob } from '../queue/analysisQueue.js';

export const getRepositories = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'Unauthorized: No access token' });
    }

    const githubService = new GitHubService(user.accessToken);
    const repos = await githubService.getUserRepositories();

    res.json({ repos });
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

    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'Unauthorized: No access token' });
    }

    const githubService = new GitHubService(user.accessToken);
    const repoDetails = await githubService.getRepository(owner, repo);

    // Fetch historical jobs/commits from DB using githubRepoId if we synced it
    const dbRepo = await db.repository.findUnique({
      where: { githubRepoId: repoDetails.id }
    });

    let recentAnalyses: (AnalysisResult & { commit: Commit })[] = [];
    if (dbRepo) {
      // Find latest completed jobs and their analysis results
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

    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'Unauthorized: No access token' });
    }

    const githubService = new GitHubService(user.accessToken);
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
       // Search by commit SHA instead of commitId if need be
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

    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'Unauthorized: No access token' });
    }

    const githubService = new GitHubService(user.accessToken);
    
    // 1. Fetch Repository Details to assert it exists and get default branch
    const repoDetails = await githubService.getRepository(owner, repo);
    
    // 2. Fetch latest commit SHA for the default branch if commitSha is not explicitly provided
    let commitSha = req.body.commitSha;
    if (!commitSha) {
      const axios = require('axios');
      const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches/${repoDetails.default_branch}`, {
        headers: {
          Authorization: `token ${user.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        }
      });
      commitSha = branchRes.data.commit.sha;
    }

    // 3. Sync Repository to our DB
    const dbRepo = await db.repository.upsert({
      where: { githubRepoId: repoDetails.id },
      create: {
        githubRepoId: repoDetails.id,
        name: repoDetails.name,
        fullName: repoDetails.full_name,
        ownerId: user.id
      },
      update: {
        name: repoDetails.name,
        fullName: repoDetails.full_name,
      }
    });

    // 4. Check if this commit was already analyzed (commit-level cache)
    const existingCommit = await db.commit.findUnique({
      where: { sha: commitSha },
      include: { analysisResult: true }
    });

    if (existingCommit && existingCommit.analysisResult) {
      // Return cached result instantly — no API call needed
      return res.json({
        message: 'Analysis already exists for this commit (cached)',
        commitSha,
        cached: true,
        analysis: existingCommit.analysisResult,
      });
    }

    // 5. Create PENDING job (only if no cached result)
    const job = await db.job.create({
      data: {
        repositoryId: dbRepo.id,
        commitSha: commitSha,
        status: 'PENDING',
        type: 'FULL_REPO'
      }
    });

    // 6. Enqueue with BullMQ
    await addAnalysisJob(dbRepo.id, commitSha, job.id);

    res.json({ message: 'Analysis triggered successfully', jobId: job.id, commitSha });
  } catch (error) {
    console.error('Error triggering analysis:', error);
    res.status(500).json({ error: 'Failed to trigger analysis' });
  }
};
