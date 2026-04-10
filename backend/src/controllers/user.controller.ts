import { Request, Response } from 'express';
import db from '../config/db.js';

export const getUserSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        useLlmForReview: true,
        geminiApiKey: true,
      }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      useLlmForReview: dbUser.useLlmForReview,
      geminiApiKey: dbUser.geminiApiKey,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { useLlmForReview, geminiApiKey } = req.body;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        useLlmForReview,
        geminiApiKey,
      },
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
