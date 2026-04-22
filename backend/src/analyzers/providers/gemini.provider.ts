import { GoogleGenAI } from '@google/genai';
import { LlmProvider, CODE_REVIEW_PROMPT, buildCodeContext, parseProviderResponse } from './provider.interface.js';
import { Issue } from '../scoring.service.js';

export class GeminiProvider implements LlmProvider {
  readonly name = 'Gemini';
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async analyze(files: { path: string; content: string }[]): Promise<{ score: number; summary: string; issues: Issue[] }> {
    const codeContext = buildCodeContext(files);

    const response = await this.genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: codeContext }] },
        { role: 'user', parts: [{ text: CODE_REVIEW_PROMPT }] },
      ],
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      }
    });

    return parseProviderResponse(response.text || '');
  }
}
