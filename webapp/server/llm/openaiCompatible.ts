import type { LLMChatMessage, LLMClient, LLMSendResult } from './types.ts';

// Shared implementation for OpenRouter + OpenAI — both speak the OpenAI chat-completions
// wire format; only the base URL (and, implicitly, which keys are valid) differs.
export class OpenAICompatibleClient implements LLMClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async send(messages: LLMChatMessage[], modelId: string, systemPrompt?: string): Promise<LLMSendResult> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });
    } catch (err) {
      throw new Error(`Network error calling ${this.baseUrl}: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Provider returned ${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new Error('Provider response was not valid JSON');
    }

    const reply = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message
      ?.content;
    if (typeof reply !== 'string') {
      throw new Error('Provider response did not contain choices[0].message.content');
    }

    const totalTokens = (data as { usage?: { total_tokens?: unknown } })?.usage?.total_tokens;
    return { reply, tokensUsed: typeof totalTokens === 'number' ? totalTokens : undefined };
  }
}

export function createOpenRouterClient(apiKey: string): LLMClient {
  return new OpenAICompatibleClient('https://openrouter.ai/api/v1', apiKey);
}

export function createOpenAIClient(apiKey: string): LLMClient {
  return new OpenAICompatibleClient('https://api.openai.com/v1', apiKey);
}
