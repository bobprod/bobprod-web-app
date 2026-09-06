import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { BlockType, PageBlock, PageSlug } from '../../lib/types';
import { PAGE_SLUGS, BLOCK_TYPES, BLOCK_TYPE_LABELS } from '../../lib/types';
import { AdminStateBlock } from '../../components/admin/AdminStateBlock';

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white';
const PAGE_LABELS: Record<PageSlug, string> = {
  home: 'Home',
  bio: 'Bio',
  music: 'Music',
  events: 'Events',
  contact: 'Contact',
  links: 'Links',
};

interface FieldSpec {
  key: string;
  label: string;
  type?: 'text' | 'textarea';
}

function emptyItemFrom(fields: FieldSpec[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}

function RepeatableEditor({
  items,
  fields,
  onChange,
}: {
  items: Record<string, string>[];
  fields: FieldSpec[];
  onChange: (items: Record<string, string>[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.map((f) =>
              f.type === 'textarea' ? (
                <textarea
                  key={f.key}
                  placeholder={f.label}
                  value={item[f.key] ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, [f.key]: e.target.value };
                    onChange(next);
                  }}
                  className={`${inputCls} sm:col-span-2`}
                  rows={2}
                />
              ) : (
                <input
                  key={f.key}
                  placeholder={f.label}
                  value={item[f.key] ?? ''}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...item, [f.key]: e.target.value };
                    onChange(next);
                  }}
                  className={inputCls}
                />
              ),
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="mt-2 text-xs text-white/45 hover:text-red-400"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, emptyItemFrom(fields)])}
        className="self-start rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
      >
        + Add item
      </button>
    </div>
  );
}

function BlockConfigEditor({
  block,
  onSave,
}: {
  block: PageBlock;
  onSave: (config: Record<string, unknown>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>(block.config);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  let body: React.ReactNode;
  switch (block.blockType) {
    case 'newsletter_signup':
      body = (
        <div className="flex flex-col gap-2">
          <input
            placeholder="Headline"
            value={(draft.headline as string) ?? ''}
            onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
            className={inputCls}
          />
          <input
            placeholder="Button label"
            value={(draft.buttonLabel as string) ?? ''}
            onChange={(e) => setDraft({ ...draft, buttonLabel: e.target.value })}
            className={inputCls}
          />
        </div>
      );
      break;
    case 'merch_grid':
      body = (
        <RepeatableEditor
          items={(draft.items as Record<string, string>[]) ?? []}
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'price', label: 'Price' },
            { key: 'imageUrl', label: 'Image URL' },
            { key: 'url', label: 'Link URL' },
          ]}
          onChange={(items) => setDraft({ ...draft, items })}
        />
      );
      break;
    case 'testimonials':
      body = (
        <RepeatableEditor
          items={(draft.quotes as Record<string, string>[]) ?? []}
          fields={[
            { key: 'text', label: 'Quote', type: 'textarea' },
            { key: 'attribution', label: 'Attribution' },
          ]}
          onChange={(quotes) => setDraft({ ...draft, quotes })}
        />
      );
      break;
    case 'press_quotes':
      body = (
        <RepeatableEditor
          items={(draft.items as Record<string, string>[]) ?? []}
          fields={[
            { key: 'outlet', label: 'Outlet' },
            { key: 'quote', label: 'Quote', type: 'textarea' },
            { key: 'logoUrl', label: 'Logo URL' },
          ]}
          onChange={(items) => setDraft({ ...draft, items })}
        />
      );
      break;
    case 'upcoming_shows':
      body = (
        <input
          type="number"
          min={1}
          placeholder="How many shows to show"
          value={(draft.limit as number) ?? 3}
          onChange={(e) => setDraft({ ...draft, limit: Number(e.target.value) })}
          className={inputCls}
        />
      );
      break;
    case 'custom_html':
      body = (
        <div>
          <textarea
            placeholder="<p>Your HTML…</p>"
            value={(draft.html as string) ?? ''}
            onChange={(e) => setDraft({ ...draft, html: e.target.value })}
            className={inputCls}
            rows={6}
          />
          <p className="mt-1 text-xs text-white/40">
            Scripts and inline event handlers are stripped on save. Only youtube.com,
            youtube-nocookie.com and soundcloud.com embeds are allowed.
          </p>
        </div>
      );
      break;
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      {body}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-3 rounded-lg bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save configuration'}
      </button>
    </div>
  );
}

export default function AdminBlocks() {
  const [page, setPage] = useState<PageSlug>('home');
  const [blocks, setBlocks] = useState<PageBlock[] | null>(null);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function load() {
    setError(false);
    setBlocks(null);
    api
      .get<PageBlock[]>(`/api/admin/blocks?page=${page}`)
      .then(setBlocks)
      .catch(() => setError(true));
  }

  useEffect(load, [page]);

  async function addBlock(blockType: BlockType) {
    const created = await api.post<PageBlock>('/api/admin/blocks', { page, blockType });
    setBlocks((prev) => [...(prev ?? []), created]);
  }

  async function toggleEnabled(block: PageBlock) {
    const updated = await api.put<PageBlock>(`/api/admin/blocks/${block.id}/enabled`, {
      enabled: !block.isEnabled,
    });
    setBlocks((prev) => prev?.map((b) => (b.id === updated.id ? updated : b)) ?? null);
  }

  async function saveConfig(block: PageBlock, config: Record<string, unknown>) {
    const updated = await api.put<PageBlock>(`/api/admin/blocks/${block.id}`, { config });
    setBlocks((prev) => prev?.map((b) => (b.id === updated.id ? updated : b)) ?? null);
  }

  async function remove(id: number) {
    await api.del(`/api/admin/blocks/${id}`);
    setBlocks((prev) => prev?.filter((b) => b.id !== id) ?? null);
    if (expandedId === id) setExpandedId(null);
  }

  async function move(index: number, dir: -1 | 1) {
    if (!blocks) return;
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const reordered = [...blocks];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBlocks(reordered);
    await api.put('/api/admin/blocks/reorder', { page, orderedIds: reordered.map((b) => b.id) });
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl text-white">Blocks</h1>
      <p className="mb-6 text-sm text-white/50">
        Activatable content sections, per page. Add, configure, and reorder — disabled blocks stay
        hidden from the public site until you enable them.
      </p>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-white/10">
        {PAGE_SLUGS.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => setPage(slug)}
            className={`rounded-t-lg px-4 py-2 text-sm ${
              page === slug ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            {PAGE_LABELS[slug]}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <span className="mr-1 self-center text-xs text-white/45">Add block:</span>
        {BLOCK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
          >
            {BLOCK_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <AdminStateBlock
        loading={!error && blocks === null}
        error={error}
        empty={blocks?.length === 0}
        emptyLabel="No blocks on this page yet — add one above."
        onRetry={load}
      />

      {blocks && blocks.length > 0 && (
        <div className="flex flex-col gap-2">
          {blocks.map((block, i) => (
            <div
              key={block.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-center gap-3">
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
                    disabled={i === blocks.length - 1}
                    className="text-white/40 hover:text-white disabled:opacity-20"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {BLOCK_TYPE_LABELS[block.blockType]}
                  </p>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-white/55">
                  <input
                    type="checkbox"
                    checked={block.isEnabled}
                    onChange={() => toggleEnabled(block)}
                  />
                  Enabled
                </label>
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === block.id ? null : block.id)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
                >
                  {expandedId === block.id ? 'Close' : 'Configure'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(block.id)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:border-red-500/40 hover:text-red-400"
                >
                  Delete
                </button>
              </div>

              {expandedId === block.id && (
                <BlockConfigEditor block={block} onSave={(config) => saveConfig(block, config)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
