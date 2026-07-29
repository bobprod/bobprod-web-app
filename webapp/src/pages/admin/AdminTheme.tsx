import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Theme } from '../../lib/types';

const DEFAULT_THEME: Theme = { accentRed: '#d1382a', accentGold: '#f0a91f', bgColor: '#0a0a0a' };

export default function AdminTheme() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<Theme>('/api/admin/theme')
      .then((t) => setTheme({ ...DEFAULT_THEME, ...t }))
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setSaved(false);
    await api.put('/api/admin/theme', theme);
    setSaved(true);
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

      <button
        type="button"
        onClick={save}
        className="rounded-lg bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Save
      </button>
      {saved && <span className="ml-3 text-xs text-green-400">Saved</span>}
    </div>
  );
}
