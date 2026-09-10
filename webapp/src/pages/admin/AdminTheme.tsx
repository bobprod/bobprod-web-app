import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { PublicConfig, Theme } from '../../lib/types';

const DEFAULT_THEME: Theme = { accentRed: '#d1382a', accentGold: '#f0a91f', bgColor: '#0a0a0a' };
const inputCls = 'w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white';
const fileInputCls =
  'w-full text-xs text-white/45 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white/70 hover:file:bg-white/15';

export default function AdminTheme() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoSaving, setSeoSaving] = useState(false);
  const [seoSaved, setSeoSaved] = useState(false);

  useEffect(() => {
    api
      .get<Theme>('/api/admin/theme')
      .then((t) => setTheme({ ...DEFAULT_THEME, ...t }))
      .finally(() => setLoaded(true));
    api.get<PublicConfig>('/api/public-config').then((config) => {
      setSeoTitle(config.seo.title ?? '');
      setSeoDescription(config.seo.description ?? '');
    });
  }, []);

  async function save() {
    setSaved(false);
    await api.put('/api/admin/theme', theme);
    setSaved(true);
  }

  async function saveSeo() {
    setSeoSaved(false);
    setSeoSaving(true);
    try {
      await api.put('/api/admin/settings/seo', { title: seoTitle, description: seoDescription });
      setSeoSaved(true);
    } finally {
      setSeoSaving(false);
    }
  }

  async function handleAvatarUpload(file: File | undefined, input: HTMLInputElement) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { url } = await api.upload('/api/admin/uploads', file);
      setSaved(false);
      setTheme((prev) => ({ ...prev, avatarUrl: url }));
    } catch {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
      input.value = '';
    }
  }

  if (!loaded) return null;

  return (
    <div className="max-w-lg">
      <h1 className="font-display mb-1 text-2xl text-white">Branding</h1>
      <p className="mb-6 text-sm text-white/50">Colors applied across the public site.</p>

      {(
        [
          ['accentRed', 'Accent — Red'],
          ['accentGold', 'Accent — Gold'],
          ['bgColor', 'Background'],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="mb-4 flex items-center gap-3">
          <input
            type="color"
            value={theme[key]}
            onChange={(e) => {
              setSaved(false);
              setTheme({ ...theme, [key]: e.target.value });
            }}
            className="h-10 w-10 cursor-pointer rounded-lg border border-white/10 bg-transparent"
          />
          <label className="w-32 text-sm text-white/70">{label}</label>
          <input
            value={theme[key]}
            onChange={(e) => {
              setSaved(false);
              setTheme({ ...theme, [key]: e.target.value });
            }}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white"
          />
        </div>
      ))}

      <div
        className="mb-6 h-24 rounded-xl border border-white/10"
        style={{ background: `linear-gradient(135deg, ${theme.accentRed}, ${theme.accentGold})` }}
      />

      <div className="mb-6 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="h-16 w-16 flex-none overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-white/10 to-white/[0.03]">
          {theme.avatarUrl && (
            <img src={theme.avatarUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm text-white/70">Photo / avatar</p>
          <input
            placeholder="https://…"
            value={theme.avatarUrl ?? ''}
            onChange={(e) => {
              setSaved(false);
              setTheme({ ...theme, avatarUrl: e.target.value });
            }}
            className={`${inputCls} mb-1.5`}
          />
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => handleAvatarUpload(e.target.files?.[0], e.target)}
            className={fileInputCls}
          />
          {uploading && <p className="mt-1 text-xs text-white/45">Uploading…</p>}
          {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
          <p className="mt-1.5 text-xs text-white/40">Shown on the public Links page.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        className="rounded-lg bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Save
      </button>
      {saved && <span className="ml-3 text-xs text-green-400">Saved</span>}

      <h2 className="font-display mt-10 mb-1 text-xl text-white">SEO</h2>
      <p className="mb-4 text-sm text-white/50">
        Default title and description used across the public site when a page doesn't set its own.
      </p>

      <div className="mb-4">
        <label htmlFor="seo-title" className="mb-1 block text-sm text-white/70">
          Title
        </label>
        <input
          id="seo-title"
          value={seoTitle}
          onChange={(e) => {
            setSeoSaved(false);
            setSeoTitle(e.target.value);
          }}
          placeholder="bobprod — House & Techno DJ / Producer"
          className={inputCls}
        />
      </div>

      <div className="mb-6">
        <label htmlFor="seo-description" className="mb-1 block text-sm text-white/70">
          Description
        </label>
        <textarea
          id="seo-description"
          value={seoDescription}
          onChange={(e) => {
            setSeoSaved(false);
            setSeoDescription(e.target.value);
          }}
          placeholder="bobprod — house & techno DJ and producer. New EP out now."
          rows={3}
          className={inputCls}
        />
      </div>

      <button
        type="button"
        onClick={saveSeo}
        disabled={seoSaving}
        className="rounded-lg bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {seoSaving ? 'Saving…' : 'Save'}
      </button>
      {seoSaved && <span className="ml-3 text-xs text-green-400">Saved</span>}
    </div>
  );
}
