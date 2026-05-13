import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    useLlmForReview: z.boolean(),
    geminiApiKey: z.string().nullable().optional(),
    llmProvider: z.enum(['gemini', 'openai', 'anthropic', 'groq']).default('gemini'),
  }),
});
