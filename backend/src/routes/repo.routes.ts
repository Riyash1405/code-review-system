import { Router } from 'express';
import { getRepositories, getRepositoryDetails, getAnalysisResult, triggerAnalysis, getCommits, getRecentAnalyses } from '../controllers/repo.controller.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

// Cache repository lists and details for 5 minutes (300 seconds)
router.get('/', cacheMiddleware(300), getRepositories);
router.get('/notifications/recent', getRecentAnalyses);
router.get('/:owner/:repo', cacheMiddleware(300), getRepositoryDetails);
router.get('/:owner/:repo/commits', getCommits);
router.get('/:owner/:repo/analysis/:commitSha', getAnalysisResult);
router.post('/:owner/:repo/analyze', triggerAnalysis);

export default router;
