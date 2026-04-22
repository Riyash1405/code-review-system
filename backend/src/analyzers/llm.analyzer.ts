import { createProvider } from './providers/factory.js';
import { Issue } from './scoring.service.js';

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

  private isRetryableError(error: any): boolean {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || 0;
    return (
      status === 429 || status === 503 ||
      msg.includes('quota') || msg.includes('rate') ||
      msg.includes('overloaded') || msg.includes('high demand') ||
      msg.includes('resource_exhausted') || msg.includes('too many requests')
    );
  }

  private extractRetryDelay(error: any): number {
    const msg = error.message || '';
    const match = msg.match(/retry\s+in\s+([\d.]+)s/i);
    return match ? Math.ceil(parseFloat(match[1]) * 1000) : 0;
  }

  private extractCleanError(error: any): string {
    const msg = error.message || 'Unknown LLM Error';
    try {
      if (msg.includes('{') && msg.includes('}')) {
        const json = JSON.parse(msg.substring(msg.indexOf('{'), msg.lastIndexOf('}') + 1));
        if (json.error?.message) return json.error.message;
      }
    } catch (e) {}
    return msg;
  }

  async analyze(files: { path: string; content: string }[]): Promise<{ score: number; summary: string; issues: Issue[] }> {
    const llmProvider = createProvider(this.provider, this.apiKey);
    console.log(`Using AI provider: ${llmProvider.name}`);

    let lastError: any = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`${llmProvider.name} attempt ${attempt}/${this.maxRetries}...`);
        return await llmProvider.analyze(files);
      } catch (error: any) {
        lastError = error;
        console.error(`${llmProvider.name} attempt ${attempt} failed:`, this.extractCleanError(error));

        if (this.isRetryableError(error) && attempt < this.maxRetries) {
          const apiDelay = this.extractRetryDelay(error);
          const backoffDelay = apiDelay > 0 ? apiDelay : (15000 * Math.pow(2, attempt - 1));
          console.log(`Rate limited. Waiting ${Math.round(backoffDelay / 1000)}s before retry...`);
          await this.sleep(backoffDelay);
          continue;
        }
        break;
      }
    }

    throw new Error(`Generative AI Analysis Failed (${llmProvider.name}): ${this.extractCleanError(lastError)}`);
  }
}
