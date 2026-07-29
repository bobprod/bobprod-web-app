export interface LLMChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMSendResult {
  reply: string;
  tokensUsed?: number;
}

export interface LLMClient {
  /**
   * Sends `messages` (in chronological order) to the provider and returns its reply.
   * `systemPrompt`, when present, is applied per-provider (a leading `system` message for
   * OpenAI-compatible APIs, the top-level `system` field for Anthropic's Messages API) —
   * it is never persisted as part of the conversation itself.
   */
  send(messages: LLMChatMessage[], modelId: string, systemPrompt?: string): Promise<LLMSendResult>;
}

export type ProviderType = 'openrouter' | 'openai' | 'anthropic' | 'custom';
