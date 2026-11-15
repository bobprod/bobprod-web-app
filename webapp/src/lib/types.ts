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
  venue: string | null;
  message: string | null;
  status: 'pending' | 'confirmed' | 'declined';
  created_at: string;
}

export interface Subscriber {
  id: number;
  email: string;
  source: string | null;
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
  avatarUrl?: string;
}

export interface ConsentPolicy {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface PublicTrackingConfig {
  gtmContainerId?: string;
  linkedInInsightTagId?: string;
  consentPolicy: ConsentPolicy;
}

export interface AdminTrackingConfig {
  gtm: { containerId: string };
  facebook: { pixelId: string; capiToken: string };
  tiktok: { pixelId: string; eventsApiToken: string };
  linkedin: { insightTagId: string };
  consentPolicy: ConsentPolicy;
}

export interface ConversionEvent {
  id: number;
  event_type: string;
  channel: 'facebook_capi' | 'tiktok_events';
  payload_json: string;
  status: 'sent' | 'failed';
  sent_at: string;
  booking_id: number | null;
}

export interface PublicConfig {
  seo: { title?: string; description?: string };
  tracking: PublicTrackingConfig;
  chatbotEnabled: boolean;
  whatsappNumber?: string;
  theme: Theme;
}

export type LLMProviderType = 'openrouter' | 'openai' | 'anthropic' | 'custom';

export interface LLMProvider {
  id: number;
  label: string;
  providerType: LLMProviderType;
  modelId: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  maskedApiKey: string;
}

export interface ChatbotSettings {
  enabled: boolean;
  systemPrompt: string;
}

// ---------- content blocks ----------

export type PageSlug = 'home' | 'bio' | 'music' | 'events' | 'contact' | 'links';

export type BlockType =
  | 'newsletter_signup'
  | 'merch_grid'
  | 'testimonials'
  | 'press_quotes'
  | 'upcoming_shows'
  | 'custom_html';

export const PAGE_SLUGS: PageSlug[] = ['home', 'bio', 'music', 'events', 'contact', 'links'];
export const BLOCK_TYPES: BlockType[] = [
  'newsletter_signup',
  'merch_grid',
  'testimonials',
  'press_quotes',
  'upcoming_shows',
  'custom_html',
];

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  newsletter_signup: 'Newsletter signup',
  merch_grid: 'Merch grid',
  testimonials: 'Testimonials',
  press_quotes: 'Press quotes',
  upcoming_shows: 'Upcoming shows',
  custom_html: 'Custom HTML',
};

export interface NewsletterSignupConfig {
  headline?: string;
  buttonLabel?: string;
}

// Deviation from docs/architecture/content-blocks.md: that spec's { productIds } shape assumes a
// Catalog/product module that doesn't exist in this codebase. Self-contained inline items instead,
// matching the testimonials/press_quotes pattern.
export interface MerchGridConfig {
  items: { name: string; price: string; imageUrl?: string; url?: string }[];
}

export interface TestimonialsConfig {
  quotes: { text: string; attribution: string }[];
}

export interface PressQuotesConfig {
  items: { outlet: string; quote: string; logoUrl?: string }[];
}

export interface UpcomingShowsConfig {
  limit: number;
}

export interface CustomHtmlConfig {
  html: string;
}

export type BlockConfig =
  | NewsletterSignupConfig
  | MerchGridConfig
  | TestimonialsConfig
  | PressQuotesConfig
  | UpcomingShowsConfig
  | CustomHtmlConfig;

export interface PageBlock {
  id: number;
  page: PageSlug;
  blockType: BlockType;
  isEnabled: boolean;
  sortOrder: number;
  config: Record<string, unknown>;
}
