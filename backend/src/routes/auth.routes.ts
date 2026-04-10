import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email', 'repo'], prompt: 'consent' } as any)
);

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
    }

    const user = req.user as any;
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, githubId: user.githubId, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token (this can be improved by setting a secure cookie instead)
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({ user: req.user });
});

export default router;
