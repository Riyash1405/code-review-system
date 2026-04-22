import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider, CODE_REVIEW_PROMPT, buildCodeContext, parseProviderResponse } from './provider.interface.js';
import { Issue } from '../scoring.service.js';

export class AnthropicProvider implements LlmProvider {
  readonly name = 'Anthropic';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyze(files: { path: string; content: string }[]): Promise<{ score: number; summary: string; issues: Issue[] }> {
    const codeContext = buildCodeContext(files);

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      messages: [
        { role: 'user', content: `${CODE_REVIEW_PROMPT}\n\n${codeContext}` },
      ],
      temperature: 0.2,
    });

    // Extract text from content blocks
    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    return parseProviderResponse(text);
  }
}
