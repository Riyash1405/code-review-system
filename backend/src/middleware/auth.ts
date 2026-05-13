import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import db from '../config/db.js';
import { logger } from '../utils/logger.js';
import { decrypt } from '../utils/crypto.js';
import type { AuthenticatedUser, GitHubAccountInfo } from '../types/index.js';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };

    // Fetch user with their GitHub accounts (needed for API access tokens)
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      include: {
        githubAccounts: true,
      },
    });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Decrypt access tokens
    const decryptedAccounts = user.githubAccounts.map((acc) => ({
      ...acc,
      accessToken: decrypt(acc.accessToken),
    }));

    // Attach a convenience `accessToken` from the primary (or first) GitHub account
    const primary = decryptedAccounts.find((a) => a.isPrimary) || decryptedAccounts[0];
    const authenticatedUser: AuthenticatedUser = {
      ...user,
      githubAccounts: decryptedAccounts as GitHubAccountInfo[],
      accessToken: primary?.accessToken || null,
      githubUsername: primary?.username || null,
    };

    req.user = authenticatedUser;
    next();
  } catch (err) {
    logger.warn({ err }, 'JWT verification failed');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
