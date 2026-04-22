import Groq from 'groq-sdk';
import { LlmProvider, CODE_REVIEW_PROMPT, buildCodeContext, parseProviderResponse } from './provider.interface.js';
import { Issue } from '../scoring.service.js';

export class GroqProvider implements LlmProvider {
  readonly name = 'Groq';
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async analyze(files: { path: string; content: string }[]): Promise<{ score: number; summary: string; issues: Issue[] }> {
    const codeContext = buildCodeContext(files);

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: CODE_REVIEW_PROMPT },
        { role: 'user', content: codeContext },
      ],
      temperature: 0.2,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    });

    const text = response.choices[0]?.message?.content || '';
    return parseProviderResponse(text);
  }
}
