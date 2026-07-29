import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Track } from '../../lib/types';
import { AdminStateBlock } from '../../components/admin/AdminStateBlock';

const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white';
const EMPTY_FORM = { title: '', artist: 'bobprod', audio_url: '', cover_url: '' };

export default function AdminTracks() {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function load() {
    setError(false);
    setTracks(null);
    api
      .get<Track[]>('/api/admin/tracks')
      .then(setTracks)
      .catch(() => setError(true));
  }

  useEffect(load, []);

  async function addTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.audio_url) return;
    setSaving(true);
    try {
      const created = await api.post<Track>('/api/admin/tracks', {
        ...form,
        cover_url: form.cover_url || null,
        sort_order: tracks?.length ?? 0,
      });
      setTracks((prev) => [...(prev ?? []), created]);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  }

  async function update(id: number, patch: Partial<Track>) {
    const updated = await api.put<Track>(`/api/admin/tracks/${id}`, patch);
    setTracks((prev) => prev?.map((t) => (t.id === id ? updated : t)) ?? null);
  }

  async function remove(id: number) {
    await api.del(`/api/admin/tracks/${id}`);
    setTracks((prev) => prev?.filter((t) => t.id !== id) ?? null);
  }

  async function move(index: number, dir: -1 | 1) {
    if (!tracks) return;
    const target = index + dir;
    if (target < 0 || target >= tracks.length) return;
    const a = tracks[index];
    const b = tracks[target];
    await Promise.all([
      update(a.id, { sort_order: b.sort_order }),
      update(b.id, { sort_order: a.sort_order }),
    ]);
    setTracks((prev) => {
      if (!prev) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl text-white">Tracks</h1>
      <p className="mb-6 text-sm text-white/50">Uploaded tracks shown on the public Music page.</p>

      <form
        onSubmit={addTrack}
        className="mb-6 grid grid-cols-[1.2fr_1fr_1.4fr_1.4fr_auto] gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4"
      >
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Artist"
          value={form.artist}
          onChange={(e) => setForm({ ...form, artist: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Audio URL"
          value={form.audio_url}
          onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
          className={inputCls}
        />
        <input
          placeholder="Cover URL (optional)"
          value={form.cover_url}
          onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
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
        loading={!error && tracks === null}
        error={error}
        empty={tracks?.length === 0}
        emptyLabel="No tracks yet — add one above."
        onRetry={load}
      />

      {tracks && tracks.length > 0 && (
        <div className="flex flex-col gap-2">
          {tracks.map((track, i) => (
            <div
              key={track.id}
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
                  disabled={i === tracks.length - 1}
                  className="text-white/40 hover:text-white disabled:opacity-20"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{track.title}</p>
                <p className="truncate text-xs text-white/45">{track.artist}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(track.id)}
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
