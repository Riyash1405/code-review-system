import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/db';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, secret) as { id: string };
    
    // Fetch user with their GitHub accounts (needed for API access tokens)
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        githubAccounts: true,
      }
    });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach a convenience `accessToken` from the primary (or first) GitHub account
    const primary = user.githubAccounts.find(a => a.isPrimary) || user.githubAccounts[0];
    (req as any).user = {
      ...user,
      accessToken: primary?.accessToken || null,
      githubUsername: primary?.username || null,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
