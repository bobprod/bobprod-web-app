import type { LLMChatMessage, LLMClient, LLMSendResult } from './types.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 1024;

// Anthropic's Messages API — different request/response shape from the OpenAI-compatible
// chat-completions APIs: auth via `x-api-key` + `anthropic-version`, system prompt is a
// top-level field (not a message), and the reply is a content-block array.
export class AnthropicLLMClient implements LLMClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(messages: LLMChatMessage[], modelId: string, systemPrompt?: string): Promise<LLMSendResult> {
    let res: Response;
    try {
      res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: MAX_TOKENS,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
    } catch (err) {
      throw new Error(`Network error calling Anthropic: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Anthropic returned ${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new Error('Anthropic response was not valid JSON');
    }

    const content = (data as { content?: unknown })?.content;
    const textBlock = Array.isArray(content)
      ? (content as Array<{ type?: string; text?: unknown }>).find((b) => b?.type === 'text')
      : undefined;
    const reply = textBlock?.text;
    if (typeof reply !== 'string') {
      throw new Error('Anthropic response did not contain a text content block');
    }

    const usage = (data as { usage?: { input_tokens?: unknown; output_tokens?: unknown } })?.usage;
    const tokensUsed =
      typeof usage?.input_tokens === 'number' && typeof usage?.output_tokens === 'number'
        ? usage.input_tokens + usage.output_tokens
        : undefined;

    return { reply, tokensUsed };
  }
}
