import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { authLoginLimiter, authRegisterLimiter, forgotPasswordLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schema.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import asyncHandler from 'express-async-handler';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const router = Router();
const JWT_SECRET = env.JWT_SECRET;
const FRONTEND_URL = env.FRONTEND_URL;

// ─── Email/Password Registration ────────────────────────────────
router.post('/register', authRegisterLimiter, validate(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists.');
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
}));

// ─── Email/Password Login ───────────────────────────────────────
router.post('/login', authLoginLimiter, validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, displayName: user.displayName },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
}));

// ─── GitHub OAuth (Quick-Start Login OR First-Time Signup) ──────
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email', 'repo'], session: false, prompt: 'consent' } as never)
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }

    const user = req.user;
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
  const user = req.user!;
  // We pass the userId as state to retrieve it after callback
  (req as unknown as { session?: { linkingUserId?: string } }).session = { linkingUserId: user.id };
  passport.authenticate('github', {
    scope: ['user:email', 'repo'],
    session: false,
    prompt: 'consent',
    state: user.id, // pass userId as state
  } as never)(req, res, next);
});

router.get('/github/link/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/settings' }),
  (req, res) => {
    // Account linked successfully, redirect back to settings
    const user = req.user!;
    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&linked=true`);
  }
);

// ─── Get Current User Profile ───────────────────────────────────
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
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
}));

// ─── Disconnect a GitHub Account ────────────────────────────────
router.delete('/github/:accountId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const accountId = String(req.params.accountId);

  const account = await db.gitHubAccount.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    throw new ConflictError('GitHub account not found.');
  }

  // Don't allow disconnecting the last account if no password set
  const userRecord = await db.user.findUnique({
    where: { id: user.id },
    include: { githubAccounts: true }
  });
  if (userRecord && !userRecord.passwordHash && userRecord.githubAccounts.length <= 1) {
    throw new ConflictError('Cannot disconnect your only GitHub account without setting a password first.');
  }

  await db.gitHubAccount.delete({ where: { id: accountId } });
  res.json({ message: 'GitHub account disconnected.' });
}));

// ─── Forgot Password ────────────────────────────────────────────
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await db.user.findUnique({ where: { email } });

  // Always return success (don't leak whether email exists)
  if (!user || !user.passwordHash) {
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
    return;
  }

  // Generate a random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  // Hash it before storing (so DB leak doesn't expose tokens)
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: expiry,
    },
  });

  // Build the reset link
  const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  // Try sending email; fall back to console if SMTP not configured
  try {
    await sendPasswordResetEmail(email, resetLink);
    logger.info(`📧 Password reset email sent to ${email}`);
  } catch (emailError) {
    logger.warn('⚠️ Could not send email, logging reset link instead:');
    logger.info(`\n🔑 Password reset link for ${email}:\n   ${resetLink}\n`);
  }

  res.json({
    message: 'If an account with that email exists, a password reset link has been sent to your inbox.',
  });
}));

// ─── Reset Password ─────────────────────────────────────────────
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { token, email, newPassword } = req.body;

  // Hash the incoming token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await db.user.findUnique({ where: { email } });

  if (
    !user ||
    user.resetToken !== hashedToken ||
    !user.resetTokenExpiry ||
    user.resetTokenExpiry < new Date()
  ) {
    throw new UnauthorizedError('Invalid or expired reset token.');
  }

  // Update password & clear the reset token
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  res.json({ message: 'Password has been reset successfully. You can now log in.' });
}));

export default router;
