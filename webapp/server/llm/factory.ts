import type { LLMClient, ProviderType } from './types.ts';
import { createOpenRouterClient, createOpenAIClient } from './openaiCompatible.ts';
import { AnthropicLLMClient } from './anthropic.ts';

/** Resolves a provider type + decrypted API key to a ready-to-use {@link LLMClient}. */
export function resolve(providerType: ProviderType, apiKey: string): LLMClient {
  switch (providerType) {
    case 'openrouter':
      return createOpenRouterClient(apiKey);
    case 'openai':
      return createOpenAIClient(apiKey);
    case 'anthropic':
      return new AnthropicLLMClient(apiKey);
    case 'custom':
      throw new Error('Provider type "custom" is not yet supported — no adapter is registered for it.');
    default: {
      const exhaustive: never = providerType;
      throw new Error(`Unknown provider type: ${exhaustive}`);
    }
  }
}
