import { Request, Response } from 'express';
import db from '../config/db.js';
import { NotFoundError, UnauthorizedError } from '../utils/errors.js';
import asyncHandler from 'express-async-handler';

export const getUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      useLlmForReview: true,
      geminiApiKey: true,
      llmProvider: true,
    }
  });

  if (!dbUser) {
    throw new NotFoundError('User not found');
  }

  res.json({
    useLlmForReview: dbUser.useLlmForReview,
    geminiApiKey: dbUser.geminiApiKey,
    llmProvider: dbUser.llmProvider,
  });
});

export const updateUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  if (!user) throw new UnauthorizedError();

  const { useLlmForReview, geminiApiKey, llmProvider } = req.body;

  await db.user.update({
    where: { id: user.id },
    data: {
      useLlmForReview,
      geminiApiKey,
      llmProvider,
    },
  });

  res.json({ message: 'Settings updated successfully' });
});
