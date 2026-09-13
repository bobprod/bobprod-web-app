import { useConsent } from '../lib/consent';
import { usePublicConfig } from '../lib/publicConfig';

export function ConsentBanner() {
  const { consent, acceptAll, acceptNecessaryOnly } = useConsent();
  const config = usePublicConfig();
  if (consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="liquid-glass flex w-[min(560px,100%)] flex-col items-center gap-3 rounded-2xl px-5 py-4 text-center sm:flex-row sm:text-left">
        <p className="flex-1 text-xs text-white/70">
          We use cookies for essential site function and, with your consent, for analytics and marketing.
          See our <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>.
        </p>
        <div className="flex flex-none gap-2">
          <button
            type="button"
            onClick={acceptNecessaryOnly}
            className="rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10"
          >
            Necessary only
          </button>
          <button
            type="button"
            onClick={() => acceptAll(config.tracking.consentPolicy)}
            className="rounded-lg px-3.5 py-2 text-xs font-semibold text-white gradient-brand"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
