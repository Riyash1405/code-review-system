import { Router } from 'express';
import authRoutes from './auth.routes.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

import webhookRoutes from './webhook.routes.js';

router.use('/auth', authRoutes);
router.use('/webhooks', webhookRoutes);

// Protect all routes below this middleware
router.use(authenticate);

import repoRoutes from './repo.routes.js';
import userRoutes from './user.routes.js';
router.use('/repos', repoRoutes);
router.use('/users', userRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', user: (req.user as any)?.username });
});

export default router;
