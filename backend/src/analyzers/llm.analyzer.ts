import { createProvider } from './providers/factory.js';
import { Issue } from './scoring.service.js';
import { logger } from '../utils/logger.js';

/**
 * LLM Analyzer orchestrator.
 * Delegates to the user's chosen AI provider via the factory pattern.
 * Handles retry logic with exponential backoff.
 */
export class LlmAnalyzer {
  private provider: string;
  private apiKey: string;
  private maxRetries: number;

  constructor(apiKey: string, provider: string = 'gemini', maxRetries: number = 3) {
    this.apiKey = apiKey;
    this.provider = provider;
    this.maxRetries = maxRetries;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryableError(error: unknown): boolean {
    const err = error as Record<string, unknown>;
    const msg = (typeof err?.message === 'string' ? err.message : '').toLowerCase();
    const status = Number(err?.status || err?.statusCode || 0);
    return (
      status === 429 || status === 503 ||
      msg.includes('quota') || msg.includes('rate') ||
      msg.includes('overloaded') || msg.includes('high demand') ||
      msg.includes('resource_exhausted') || msg.includes('too many requests')
    );
  }

  private extractRetryDelay(error: unknown): number {
    const err = error as Record<string, unknown>;
    const msg = typeof err?.message === 'string' ? err.message : '';
    const match = msg.match(/retry\s+in\s+([\d.]+)s/i);
    return match ? Math.ceil(parseFloat(match[1]) * 1000) : 0;
  }

  private extractCleanError(error: unknown): string {
    const err = error as Record<string, unknown>;
    const msg = typeof err?.message === 'string' ? err.message : 'Unknown LLM Error';
    try {
      if (msg.includes('{') && msg.includes('}')) {
        const json = JSON.parse(msg.substring(msg.indexOf('{'), msg.lastIndexOf('}') + 1));
        if (json.error?.message) return json.error.message;
      }
    } catch (e) {
      // ignore parse error
    }
    return msg;
  }

  async analyze(files: { path: string; content: string }[]): Promise<{ score: number; summary: string; issues: Issue[] }> {
    const llmProvider = createProvider(this.provider, this.apiKey);
    logger.info(`Using AI provider: ${llmProvider.name}`);

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`${llmProvider.name} attempt ${attempt}/${this.maxRetries}...`);
        return await llmProvider.analyze(files);
      } catch (error: unknown) {
        lastError = error;
        logger.error({ err: error }, `${llmProvider.name} attempt ${attempt} failed: ${this.extractCleanError(error)}`);

        if (this.isRetryableError(error) && attempt < this.maxRetries) {
          const apiDelay = this.extractRetryDelay(error);
          const backoffDelay = apiDelay > 0 ? apiDelay : (15000 * Math.pow(2, attempt - 1));
          logger.info(`Rate limited. Waiting ${Math.round(backoffDelay / 1000)}s before retry...`);
          await this.sleep(backoffDelay);
          continue;
        }
        break;
      }
    }

    throw new Error(`Generative AI Analysis Failed (${llmProvider.name}): ${this.extractCleanError(lastError)}`);
  }
}
