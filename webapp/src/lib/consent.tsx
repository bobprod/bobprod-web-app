import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ConsentPolicy } from './types';

const STORAGE_KEY = 'bobprod-consent';

const NECESSARY_ONLY: ConsentPolicy = { necessary: true, analytics: false, marketing: false };
const ALL: ConsentPolicy = { necessary: true, analytics: true, marketing: true };

interface ConsentContextValue {
  consent: ConsentPolicy | null; // null = visitor hasn't decided yet
  /** ceiling: admin can disable an entire category site-wide (e.g. no marketing tools configured) —
   *  "accept all" can never grant more than the site actually offers. */
  acceptAll: (ceiling?: ConsentPolicy) => void;
  acceptNecessaryOnly: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: NECESSARY_ONLY,
  acceptAll: () => {},
  acceptNecessaryOnly: () => {},
});

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentPolicy | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setConsent(JSON.parse(stored));
    } catch {
      // localStorage unavailable (private mode, etc.) — fall through to no-decision state
    }
  }, []);

  function persist(next: ConsentPolicy) {
    setConsent(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // best-effort only
    }
  }

  return (
    <ConsentContext.Provider
      value={{
        consent,
        acceptAll: (ceiling) =>
          persist(ceiling ? { necessary: true, analytics: ceiling.analytics, marketing: ceiling.marketing } : ALL),
        acceptNecessaryOnly: () => persist(NECESSARY_ONLY),
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  return useContext(ConsentContext);
}
