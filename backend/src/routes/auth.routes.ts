import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Email/Password Registration ────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { email, passwordHash, displayName },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── Email/Password Login ───────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GitHub OAuth (Quick-Start Login OR First-Time Signup) ──────
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email', 'repo'], session: false, prompt: 'consent' } as any)
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }

    const user = req.user as any;
    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// ─── Link Additional GitHub Account (authenticated user) ────────
router.get('/github/link', authenticate, (req: Request, res: Response, next) => {
  // Store the current user ID in a temporary way through the URL state
  const user = req.user as any;
  // We pass the userId as state to retrieve it after callback
  (req as any).session = { linkingUserId: user.id };
  passport.authenticate('github', {
    scope: ['user:email', 'repo'],
    session: false,
    prompt: 'consent',
    state: user.id, // pass userId as state
  } as any)(req, res, next);
});

router.get('/github/link/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/settings' }),
  (req, res) => {
    // Account linked successfully, redirect back to settings
    const user = req.user as any;
    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&linked=true`);
  }
);

// ─── Get Current User Profile ───────────────────────────────────
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = req.user as any;
  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    include: {
      githubAccounts: {
        select: {
          id: true,
          githubId: true,
          username: true,
          avatarUrl: true,
          isPrimary: true,
          connectedAt: true,
        }
      }
    }
  });
  res.json({ user: fullUser });
});

// ─── Disconnect a GitHub Account ────────────────────────────────
router.delete('/github/:accountId', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const accountId = String(req.params.accountId);

    const account = await db.gitHubAccount.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== user.id) {
      return res.status(404).json({ error: 'GitHub account not found.' });
    }

    // Don't allow disconnecting the last account if no password set
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      include: { githubAccounts: true }
    });
    if (userRecord && !userRecord.passwordHash && userRecord.githubAccounts.length <= 1) {
      return res.status(400).json({ error: 'Cannot disconnect your only GitHub account without setting a password first.' });
    }

    await db.gitHubAccount.delete({ where: { id: accountId } });
    res.json({ message: 'GitHub account disconnected.' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

export default router;
