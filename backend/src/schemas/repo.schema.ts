import { z } from 'zod';

export const triggerAnalysisSchema = z.object({
  body: z.object({
    commitSha: z.string().optional(),
    force: z.boolean().optional(),
  }),
  params: z.object({
    owner: z.string().min(1, 'Owner is required'),
    repo: z.string().min(1, 'Repo is required'),
  }),
});

export const retryJobSchema = z.object({
  params: z.object({
    owner: z.string().min(1, 'Owner is required'),
    repo: z.string().min(1, 'Repo is required'),
    jobId: z.string().min(1, 'Job ID is required'),
  }),
});
