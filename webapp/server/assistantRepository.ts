import { db, getSetting, setSetting } from './db.ts';
import { encrypt, decrypt, maskApiKey } from './crypto.ts';
import type { ProviderType } from './llm/types.ts';

// ---------- llm_providers ----------

interface LLMProviderRow {
  id: number;
  label: string;
  provider_type: ProviderType;
  encrypted_api_key: string;
  model_id: string;
  is_active: number;
  is_default: number;
  created_at: string;
}

export interface LLMProviderMasked {
  id: number;
  label: string;
  providerType: ProviderType;
  modelId: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  maskedApiKey: string;
}

export interface LLMProviderDecrypted {
  id: number;
  providerType: ProviderType;
  modelId: string;
  apiKey: string;
}

function getRow(id: number): LLMProviderRow | undefined {
  return db.prepare('SELECT * FROM llm_providers WHERE id = ?').get(id) as unknown as LLMProviderRow | undefined;
}

function toMasked(row: LLMProviderRow): LLMProviderMasked {
  return {
    id: row.id,
    label: row.label,
    providerType: row.provider_type,
    modelId: row.model_id,
    isActive: row.is_active === 1,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
    maskedApiKey: maskApiKey(decrypt(row.encrypted_api_key)),
  };
}

export const providers = {
  list(): LLMProviderMasked[] {
    const rows = db.prepare('SELECT * FROM llm_providers ORDER BY id ASC').all() as unknown as LLMProviderRow[];
    return rows.map(toMasked);
  },

  create(data: { label: string; providerType: ProviderType; apiKey: string; modelId: string; isActive?: boolean }): LLMProviderMasked {
    const encrypted = encrypt(data.apiKey);
    const info = db
      .prepare(
        'INSERT INTO llm_providers (label, provider_type, encrypted_api_key, model_id, is_active, is_default) VALUES (?, ?, ?, ?, ?, 0)',
      )
      .run(data.label, data.providerType, encrypted, data.modelId, data.isActive === false ? 0 : 1);
    const created = getRow(Number(info.lastInsertRowid));
    if (!created) throw new Error('Failed to create provider');
    return toMasked(created);
  },

  update(
    id: number,
    patch: { label?: string; providerType?: ProviderType; apiKey?: string; modelId?: string; isActive?: boolean },
  ): LLMProviderMasked {
    const current = getRow(id);
    if (!current) throw new Error('Provider not found');

    // Empty/omitted apiKey means "keep the existing encrypted key" — only re-encrypt when a
    // non-empty new key is actually submitted.
    const encryptedApiKey = patch.apiKey && patch.apiKey.trim() !== '' ? encrypt(patch.apiKey) : current.encrypted_api_key;
    const next = {
      label: patch.label ?? current.label,
      provider_type: patch.providerType ?? current.provider_type,
      model_id: patch.modelId ?? current.model_id,
      is_active: patch.isActive === undefined ? current.is_active : patch.isActive ? 1 : 0,
    };
    db.prepare(
      'UPDATE llm_providers SET label = ?, provider_type = ?, encrypted_api_key = ?, model_id = ?, is_active = ? WHERE id = ?',
    ).run(next.label, next.provider_type, encryptedApiKey, next.model_id, next.is_active, id);

    const updated = getRow(id);
    if (!updated) throw new Error('Provider not found');
    return toMasked(updated);
  },

  remove(id: number): void {
    const current = getRow(id);
    if (!current) throw new Error('Provider not found');
    if (current.is_default === 1) {
      const { c } = db.prepare('SELECT COUNT(*) as c FROM llm_providers').get() as { c: number };
      if (c > 1) {
        throw new Error(
          'Cannot delete the default provider while other providers exist — set a different provider as default first.',
        );
      }
    }
    db.prepare('DELETE FROM llm_providers WHERE id = ?').run(id);
  },

  /** Atomically unsets the previous default and sets the new one — single transaction, never zero or two defaults. */
  setDefault(id: number): LLMProviderMasked {
    const current = getRow(id);
    if (!current) throw new Error('Provider not found');
    db.exec('BEGIN');
    try {
      db.prepare('UPDATE llm_providers SET is_default = 0 WHERE is_default = 1').run();
      db.prepare('UPDATE llm_providers SET is_default = 1 WHERE id = ?').run(id);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    const updated = getRow(id);
    if (!updated) throw new Error('Provider not found');
    return toMasked(updated);
  },

  /** The active default provider, decrypted — for internal use only (chat send path). Never expose over HTTP. */
  getDefaultActive(): LLMProviderDecrypted | undefined {
    const row = db.prepare('SELECT * FROM llm_providers WHERE is_active = 1 AND is_default = 1').get() as unknown as
      | LLMProviderRow
      | undefined;
    if (!row) return undefined;
    return { id: row.id, providerType: row.provider_type, modelId: row.model_id, apiKey: decrypt(row.encrypted_api_key) };
  },

  /** A single provider, decrypted — for internal use only (test-connection route). Never expose over HTTP. */
  getDecrypted(id: number): LLMProviderDecrypted | undefined {
    const row = getRow(id);
    if (!row) return undefined;
    return { id: row.id, providerType: row.provider_type, modelId: row.model_id, apiKey: decrypt(row.encrypted_api_key) };
  },
};

// ---------- chat_conversations / chat_messages ----------

export interface ChatConversation {
  id: number;
  visitor_session_id: string;
  started_at: string;
  ended_at: string | null;
}

export interface ChatMessageRow {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  provider_id: number | null;
  tokens_used: number | null;
  created_at: string;
}

export function getOrCreateConversation(sessionId: string): ChatConversation {
  const existing = db
    .prepare('SELECT * FROM chat_conversations WHERE visitor_session_id = ? ORDER BY id DESC LIMIT 1')
    .get(sessionId) as unknown as ChatConversation | undefined;
  if (existing) return existing;
  const info = db.prepare('INSERT INTO chat_conversations (visitor_session_id) VALUES (?)').run(sessionId);
  return db.prepare('SELECT * FROM chat_conversations WHERE id = ?').get(info.lastInsertRowid) as unknown as ChatConversation;
}

export function appendMessage(
  conversationId: number,
  role: 'user' | 'assistant',
  content: string,
  providerId: number | null,
  tokensUsed: number | null,
): ChatMessageRow {
  const info = db
    .prepare(
      'INSERT INTO chat_messages (conversation_id, role, content, provider_id, tokens_used) VALUES (?, ?, ?, ?, ?)',
    )
    .run(conversationId, role, content, providerId, tokensUsed);
  return db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(info.lastInsertRowid) as unknown as ChatMessageRow;
}

export function listMessages(conversationId: number): ChatMessageRow[] {
  return db
    .prepare('SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC')
    .all(conversationId) as unknown as ChatMessageRow[];
}

// ---------- chatbot settings ----------

export const chatbotSettings = {
  get(): { enabled: boolean; systemPrompt: string } {
    return {
      enabled: getSetting('chatbotEnabled', false),
      systemPrompt: getSetting('chatbotSystemPrompt', ''),
    };
  },
  set(enabled: boolean, systemPrompt?: string): { enabled: boolean; systemPrompt: string } {
    setSetting('chatbotEnabled', enabled);
    if (systemPrompt !== undefined) {
      setSetting('chatbotSystemPrompt', systemPrompt);
    }
    return chatbotSettings.get();
  },
};
