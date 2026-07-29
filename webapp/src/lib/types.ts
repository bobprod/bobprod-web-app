export interface Track {
  id: number;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  sort_order: number;
}

export interface EventItem {
  id: number;
  event_date: string;
  venue: string;
  city: string | null;
  ticket_url: string | null;
  is_published: number;
}

export interface Booking {
  id: number;
  name: string;
  email: string;
  event_type: string | null;
  requested_date: string | null;
  message: string | null;
  status: 'pending' | 'confirmed' | 'declined';
  created_at: string;
}

export interface Biolink {
  id: number;
  platform: string;
  label: string;
  url: string;
  sort_order: number;
  is_enabled: number;
}

export interface Theme {
  accentRed: string;
  accentGold: string;
  bgColor: string;
}

export interface PublicConfig {
  seo: { title?: string; description?: string };
  tracking: { gtmId?: string; linkedInPartnerId?: string };
  chatbotEnabled: boolean;
  theme: Theme;
}
