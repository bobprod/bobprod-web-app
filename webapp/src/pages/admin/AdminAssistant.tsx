import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import type { ChatbotSettings, LLMProvider, LLMProviderType } from '../../lib/types';
import { AdminStateBlock } from '../../components/admin/AdminStateBlock';

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white';
const PROVIDER_TYPES: { value: LLMProviderType; label: string }[] = [
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
];
const EMPTY_FORM = { label: '', providerType: 'openrouter' as LLMProviderType, modelId: '', apiKey: '' };

type TestResult = { success: boolean; latencyMs: number; error?: string };

export default function AdminAssistant() {
  const [providers, setProviders] = useState<LLMProvider[] | null>(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<Record<number, string>>({});
  const [testResults, setTestResults] = useState<Record<number, TestResult | 'pending'>>({});

  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  function load() {
    setError(false);
    setProviders(null);
    api
      .get<LLMProvider[]>('/api/admin/assistant/providers')
      .then(setProviders)
      .catch(() => setError(true));
  }

  useEffect(load, []);
  useEffect(() => {
    api.get<ChatbotSettings>('/api/admin/settings/chatbot').then(setSettings);
  }, []);

  async function addProvider(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label || !form.modelId || !form.apiKey) return;
    setSaving(true);
    try {
      const created = await api.post<LLMProvider>('/api/admin/assistant/providers', form);
      setProviders((prev) => [...(prev ?? []), created]);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(id: number) {
    const updated = await api.put<LLMProvider>(`/api/admin/assistant/providers/${id}/default`, {});
    setProviders((prev) => prev?.map((p) => ({ ...p, isDefault: p.id === updated.id })) ?? null);
  }

  async function toggleActive(p: LLMProvider) {
    const updated = await api.put<LLMProvider>(`/api/admin/assistant/providers/${p.id}`, { isActive: !p.isActive });
    setProviders((prev) => prev?.map((row) => (row.id === updated.id ? updated : row)) ?? null);
  }

  async function remove(id: number) {
    setRowError((prev) => ({ ...prev, [id]: '' }));
    try {
      await api.del(`/api/admin/assistant/providers/${id}`);
      setProviders((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not delete this provider.';
      setRowError((prev) => ({ ...prev, [id]: message }));
    }
  }

  async function testConnection(id: number) {
    setTestResults((prev) => ({ ...prev, [id]: 'pending' }));
    try {
      const result = await api.post<TestResult>(`/api/admin/assistant/providers/${id}/test`, {});
      setTestResults((prev) => ({ ...prev, [id]: result }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Test failed.';
      setTestResults((prev) => ({ ...prev, [id]: { success: false, latencyMs: 0, error: message } }));
    }
  }

  async function saveSettings() {
    if (!settings) return;
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      const updated = await api.put<ChatbotSettings>('/api/admin/settings/chatbot', settings);
      setSettings(updated);
      setSettingsSaved(true);
    } finally {
      setSettingsSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl text-white">Assistant</h1>
      <p className="mb-6 text-sm text-white/50">
        Bring-your-own-key LLM providers for the public chat widget, plus the chatbot toggle and system prompt.
      </p>

      <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Chatbot settings</h2>
        {!settings ? (
          <div className="h-20 animate-pulse rounded-lg bg-white/5" />
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => {
                  setSettingsSaved(false);
                  setSettings({ ...settings, enabled: e.target.checked });
                }}
              />
              Chatbot enabled (shows the widget on every public page)
            </label>
            <div>
              <label className="mb-1 block text-xs text-white/55">
                System prompt (server-side only — never sent to the browser)
              </label>
              <textarea
                rows={4}
                value={settings.systemPrompt}
                onChange={(e) => {
                  setSettingsSaved(false);
                  setSettings({ ...settings, systemPrompt: e.target.value });
                }}
                placeholder="You are the assistant for bobprod's website…"
                className={inputCls}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={saveSettings}
                disabled={settingsSaving}
                className="rounded-lg bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Save settings
              </button>
              {settingsSaved && <span className="ml-3 text-xs text-green-400">Saved</span>}
            </div>
          </div>
        )}
      </section>

      <h2 className="mb-3 text-sm font-semibold text-white">Providers</h2>

      <form
        onSubmit={addProvider}
        className="mb-6 grid grid-cols-[1fr_1fr_1.2fr_1.2fr_auto] gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4"
      >
        <input
          placeholder="Label (e.g. Main OpenRouter key)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className={inputCls}
        />
        <select
          value={form.providerType}
          onChange={(e) => setForm({ ...form, providerType: e.target.value as LLMProviderType })}
          className={inputCls}
        >
          {PROVIDER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          placeholder="Model id (e.g. anthropic/claude-sonnet-5)"
          value={form.modelId}
          onChange={(e) => setForm({ ...form, modelId: e.target.value })}
          className={inputCls}
        />
        <input
          type="password"
          placeholder="API key"
          value={form.apiKey}
          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          className={inputCls}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add
        </button>
      </form>

      <AdminStateBlock
        loading={!error && providers === null}
        error={error}
        empty={providers?.length === 0}
        emptyLabel="No providers configured yet — add one above."
        onRetry={load}
      />

      {providers && providers.length > 0 && (
        <div className="flex flex-col gap-2">
          {providers.map((p) => {
            const test = testResults[p.id];
            return (
              <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{p.label}</p>
                    <p className="truncate text-xs text-white/45">
                      {p.providerType} · {p.modelId} · {p.maskedApiKey}
                    </p>
                  </div>
                  {p.isDefault && (
                    <span className="rounded-full border border-[var(--accent-gold)]/40 px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent-gold)]">
                      Default
                    </span>
                  )}
                  <label className="flex items-center gap-1.5 text-xs text-white/55">
                    <input type="checkbox" checked={p.isActive} onChange={() => toggleActive(p)} />
                    Active
                  </label>
                  {!p.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefault(p.id)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-white/30"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => testConnection(p.id)}
                    disabled={test === 'pending'}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-white/30 disabled:opacity-60"
                  >
                    {test === 'pending' ? 'Testing…' : 'Test connection'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:border-red-500/40 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
                {test && test !== 'pending' && (
                  <p className={`mt-2 text-xs ${test.success ? 'text-green-400' : 'text-red-400'}`}>
                    {test.success ? `Success — ${test.latencyMs}ms` : `Failed: ${test.error}`}
                  </p>
                )}
                {rowError[p.id] && <p className="mt-2 text-xs text-red-400">{rowError[p.id]}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
