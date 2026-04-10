import { GoogleGenAI } from '@google/genai';
import { Issue } from './scoring.service.js';

export class LlmAnalyzer {
  private genAI: GoogleGenAI;
  private maxRetries: number;

  constructor(apiKey: string, maxRetries: number = 3) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.maxRetries = maxRetries;
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract a human-readable error message from Gemini API errors
   */
  private extractCleanError(error: any): string {
    const msg = error.message || 'Unknown LLM Error';
    try {
      if (msg.includes('{') && msg.includes('}')) {
        const extractedJson = msg.substring(msg.indexOf('{'), msg.lastIndexOf('}') + 1);
        const parsed = JSON.parse(extractedJson);
        if (parsed.error && parsed.error.message) {
          return parsed.error.message;
        }
      }
    } catch (e) {
      // Fallback to raw message
    }
    return msg;
  }

  /**
   * Check if an error is a retryable rate-limit / quota / overload error
   */
  private isRetryableError(error: any): boolean {
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || 0;
    return (
      status === 429 ||
      status === 503 ||
      msg.includes('quota') ||
      msg.includes('rate') ||
      msg.includes('overloaded') ||
      msg.includes('high demand') ||
      msg.includes('resource_exhausted') ||
      msg.includes('too many requests')
    );
  }

  /**
   * Extract retry delay hint from error messages (e.g. "retry in 57.8s")
   */
  private extractRetryDelay(error: any): number {
    const msg = error.message || '';
    const match = msg.match(/retry\s+in\s+([\d.]+)s/i);
    if (match) {
      return Math.ceil(parseFloat(match[1]) * 1000); // convert to ms
    }
    return 0;
  }

  async analyze(files: { path: string; content: string }[]): Promise<{ score: number; summary: string; issues: Issue[] }> {
    // 1. Prepare codebase payload — stay well within free tier limits
    // Free tier = 250k tokens/min. ~4 chars per token → aim for ~60k chars to be safe.
    const MAX_CHARS = 60000;
    let codeContext = 'Here is the codebase to review:\n\n';
    let currentCharCount = 0;

    // Prioritize important source code files, sorted smallest-first for maximum coverage
    const codeExtensions = /\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|cs|rb|php|swift|kt|scala|vue|svelte)$/i;
    const sortedFiles = files
      .filter(f => f && f.content && f.content.trim().length > 0 && codeExtensions.test(f.path))
      .sort((a, b) => a.content.length - b.content.length);

    for (const file of sortedFiles) {
      const fileString = `### File: ${file.path} ###\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
      if (currentCharCount + fileString.length > MAX_CHARS) {
        console.warn(`LLM Context limit reached at ${currentCharCount} chars. Truncating remaining files.`);
        break;
      }
      codeContext += fileString;
      currentCharCount += fileString.length;
    }

    if (currentCharCount === 0) {
      throw new Error('No readable source code files found in this repository to analyze.');
    }

    console.log(`LLM context prepared: ${currentCharCount} chars from ${sortedFiles.length} files`);

    // 2. Define the strict instruction prompt
    const prompt = `You are a Senior Full-Stack Engineer performing a Code Review.
Analyze the provided codebase and respond STRICTLY in JSON format without any markdown wrappers or preamble.
The JSON must adhere to this schema:
{
  "score": number, // out of 100 based on overall structural code quality
  "summary": string, // 1-2 sentence overall review summary
  "issues": [
    {
      "type": "COMPLEXITY" | "SMELL" | "STYLE" | "SECURITY" | "PERFORMANCE",
      "file": string, // filepath of the offending file
      "line": number, // approximate line number of the issue
      "message": string // detailed, helpful explanation of the code smell and how to fix it
    }
  ]
}

Ensure you provide highly critical but constructive feedback. Flag deep nesting, any usage of deprecated functions, security vulnerabilities like hardcoded secrets or eval, poor variable naming, lack of standard error handling, or performance traps. Return ONLY the JSON object.`;

    // 3. Retry loop with exponential backoff
    let lastError: any = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`LLM attempt ${attempt}/${this.maxRetries}...`);

        const response = await this.genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: codeContext }] },
            { role: 'user', parts: [{ text: prompt }] },
          ],
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            maxOutputTokens: 2048, // Cap output to save quota
          }
        });

        const responseText = response.text || '';
        const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const resultObj = JSON.parse(cleanJsonStr);

        return {
          score: resultObj.score ?? 80,
          summary: resultObj.summary || 'AI Review completed successfully.',
          issues: Array.isArray(resultObj.issues) ? resultObj.issues : []
        };

      } catch (error: any) {
        lastError = error;
        console.error(`LLM attempt ${attempt} failed:`, this.extractCleanError(error));

        if (this.isRetryableError(error) && attempt < this.maxRetries) {
          // Use the API-suggested delay, or exponential backoff (15s, 30s, 60s)
          const apiDelay = this.extractRetryDelay(error);
          const backoffDelay = apiDelay > 0 ? apiDelay : (15000 * Math.pow(2, attempt - 1));
          console.log(`Rate limited. Waiting ${Math.round(backoffDelay / 1000)}s before retry...`);
          await this.sleep(backoffDelay);
          continue;
        }
        break; // Non-retryable error, stop immediately
      }
    }

    // All retries exhausted
    throw new Error(`Generative AI Analysis Failed: ${this.extractCleanError(lastError)}`);
  }
}
