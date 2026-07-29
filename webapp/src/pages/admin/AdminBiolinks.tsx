import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Biolink } from '../../lib/types';
import { AdminStateBlock } from '../../components/admin/AdminStateBlock';

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white';
const EMPTY_FORM = { platform: '', label: '', url: '' };

export default function AdminBiolinks() {
  const [links, setLinks] = useState<Biolink[] | null>(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setError(false);
    setLinks(null);
    api
      .get<Biolink[]>('/api/admin/biolinks')
      .then(setLinks)
      .catch(() => setError(true));
  }

  useEffect(load, []);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!form.platform || !form.label || !form.url) return;
    setSaving(true);
    try {
      const created = await api.post<Biolink>('/api/admin/biolinks', {
        ...form,
        sort_order: links?.length ?? 0,
      });
      setLinks((prev) => [...(prev ?? []), created]);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  }

  async function update(id: number, patch: Partial<Biolink>) {
    const updated = await api.put<Biolink>(`/api/admin/biolinks/${id}`, patch);
    setLinks((prev) => prev?.map((l) => (l.id === id ? updated : l)) ?? null);
  }

  async function remove(id: number) {
    await api.del(`/api/admin/biolinks/${id}`);
    setLinks((prev) => prev?.filter((l) => l.id !== id) ?? null);
  }

  async function move(index: number, dir: -1 | 1) {
    if (!links) return;
    const target = index + dir;
    if (target < 0 || target >= links.length) return;
    const a = links[index];
    const b = links[target];
    await Promise.all([
      update(a.id, { sort_order: b.sort_order }),
      update(b.id, { sort_order: a.sort_order }),
    ]);
    setLinks((prev) => {
      if (!prev) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl text-white">Links</h1>
      <p className="mb-6 text-sm text-white/50">Manage the public link-in-bio page at /links.</p>

      <form onSubmit={addLink} className="mb-6 grid grid-cols-[1fr_1fr_2fr_auto] gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input
          placeholder="Platform (e.g. Spotify)"
          value={form.platform}
          onChange={(e) => setForm({ ...form, platform: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Label"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="https://…"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
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
        loading={!error && links === null}
        error={error}
        empty={links?.length === 0}
        emptyLabel="No links yet — add one above."
        onRetry={load}
      />

      {links && links.length > 0 && (
        <div className="flex flex-col gap-2">
          {links.map((link, i) => (
            <div
              key={link.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-white/40 hover:text-white disabled:opacity-20"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === links.length - 1}
                  className="text-white/40 hover:text-white disabled:opacity-20"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{link.label}</p>
                <p className="truncate text-xs text-white/45">
                  {link.platform} · {link.url}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-white/55">
                <input
                  type="checkbox"
                  checked={!!link.is_enabled}
                  onChange={(e) => update(link.id, { is_enabled: e.target.checked ? 1 : 0 })}
                />
                Enabled
              </label>
              <button
                type="button"
                onClick={() => remove(link.id)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:border-red-500/40 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
