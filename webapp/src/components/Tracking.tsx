import { useEffect } from 'react';
import { usePublicConfig } from '../lib/publicConfig';
import { useConsent } from '../lib/consent';

/**
 * Injects client-side tags (GTM, LinkedIn Insight Tag) only once the visitor has granted
 * analytics consent AND the respective ID is configured in the admin. Renders nothing.
 */
export function Tracking() {
  const config = usePublicConfig();
  const { consent } = useConsent();
  const analyticsGranted = consent?.analytics ?? false;
  const { gtmContainerId, linkedInInsightTagId } = config.tracking;

  useEffect(() => {
    if (!analyticsGranted || !gtmContainerId) return;
    if (document.getElementById('gtm-script')) return;

    (window as unknown as Record<string, unknown[]>).dataLayer =
      (window as unknown as Record<string, unknown[]>).dataLayer || [];
    (window as unknown as { dataLayer: unknown[] }).dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js',
    });

    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmContainerId}`;
    document.head.appendChild(script);
  }, [analyticsGranted, gtmContainerId]);

  useEffect(() => {
    if (!analyticsGranted || !linkedInInsightTagId) return;
    if (document.getElementById('linkedin-insight-script')) return;

    (window as unknown as { _linkedin_partner_id?: string })._linkedin_partner_id = linkedInInsightTagId;
    const w = window as unknown as { _linkedin_data_partner_ids?: string[] };
    w._linkedin_data_partner_ids = w._linkedin_data_partner_ids || [];
    w._linkedin_data_partner_ids.push(linkedInInsightTagId);

    const script = document.createElement('script');
    script.id = 'linkedin-insight-script';
    script.async = true;
    script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
    document.head.appendChild(script);
  }, [analyticsGranted, linkedInInsightTagId]);

  return null;
}
