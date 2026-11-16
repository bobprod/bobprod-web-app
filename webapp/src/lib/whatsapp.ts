import type { EventItem } from './types';

const EVENT_TYPE_LABELS_FR: Record<string, string> = {
  'Club Night': 'Soirée club',
  'Private Event': 'Événement privé',
  Festival: 'Festival',
};

function formatDateFr(date: Date | string): string | null {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Builds a wa.me link, or null when no number is configured. */
export function whatsappUrl(number: string | undefined, message: string): string | null {
  const digits = (number ?? '').replace(/\D/g, '');
  // A placeholder such as "216XXXXXXXX" strips down to "216": treat anything too short as not configured.
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Message for a service booking (the visitor picks type, date and place). */
export function prestationMessage(input: { type: string; date: Date | null; venue: string }): string {
  const lines = ['Bonjour bobprod, je souhaite réserver une prestation.'];
  lines.push(`Type : ${EVENT_TYPE_LABELS_FR[input.type] ?? input.type}`);
  const date = input.date ? formatDateFr(input.date) : null;
  lines.push(`Date : ${date ?? 'à définir'}`);
  lines.push(`Lieu : ${input.venue.trim() || 'à définir'}`);
  return lines.join('\n');
}

/** Message for a booking tied to a listed event (e.g. a night at a lounge). */
export function eventMessage(event: Pick<EventItem, 'event_date' | 'venue' | 'city'>): string {
  const date = formatDateFr(event.event_date);
  const place = [event.venue, event.city].filter(Boolean).join(', ');
  const lines = ['Bonjour bobprod, je souhaite réserver pour cet événement.'];
  lines.push(`Lieu : ${place || 'à confirmer'}`);
  lines.push(`Date : ${date ?? 'à confirmer'}`);
  return lines.join('\n');
}
