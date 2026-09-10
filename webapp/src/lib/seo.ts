import type { EventItem } from './types';

// Placeholder production domain — swap for the real one when the site goes live.
// Referenced by JSON-LD below and by public/sitemap.xml / public/robots.txt.
export const SITE_URL = 'https://bobprod.example';

export function musicGroupJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: 'bobprod',
    genre: ['House', 'Techno'],
    url: SITE_URL,
  };
}

export function musicEventJsonLd(event: EventItem) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: `bobprod live at ${event.venue}`,
    startDate: event.event_date,
    location: {
      '@type': 'Place',
      name: event.city ?? event.venue,
    },
    ...(event.ticket_url
      ? { offers: { '@type': 'Offer', url: event.ticket_url, availability: 'https://schema.org/InStock' } }
      : {}),
  };
}
