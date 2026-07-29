import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { PublicConfig } from './types';

const DEFAULT_CONFIG: PublicConfig = {
  seo: {},
  tracking: {},
  chatbotEnabled: false,
  theme: { accentRed: '#d1382a', accentGold: '#f0a91f', bgColor: '#0a0a0a' },
};

const PublicConfigContext = createContext<PublicConfig>(DEFAULT_CONFIG);

export function PublicConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    api
      .get<PublicConfig>('/api/public-config')
      .then(setConfig)
      .catch(() => setConfig(DEFAULT_CONFIG));
  }, []);

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent-red', config.theme.accentRed);
    root.setProperty('--accent-gold', config.theme.accentGold);
    root.setProperty('--bg', config.theme.bgColor);
  }, [config.theme]);

  return <PublicConfigContext.Provider value={config}>{children}</PublicConfigContext.Provider>;
}

export function usePublicConfig() {
  return useContext(PublicConfigContext);
}
