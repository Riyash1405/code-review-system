import type { LlmProvider } from './provider.interface.js';
import { GeminiProvider } from './gemini.provider.js';
import { OpenAiProvider } from './openai.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';
import { GroqProvider } from './groq.provider.js';

export type ProviderName = 'gemini' | 'openai' | 'anthropic' | 'groq';

/**
 * Factory function to create the correct AI provider based on user preference.
 */
export function createProvider(provider: string, apiKey: string): LlmProvider {
  switch (provider) {
    case 'openai':
      return new OpenAiProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    case 'groq':
      return new GroqProvider(apiKey);
    case 'gemini':
    default:
      return new GeminiProvider(apiKey);
  }
}
