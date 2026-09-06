export type BiolinkCategory = 'Listen' | 'Watch' | 'Follow' | 'Shop' | 'More';

const LISTEN = ['spotify', 'apple music', 'deezer', 'beatport', 'soundcloud', 'tidal', 'amazon music', 'bandcamp'];
const WATCH = ['youtube', 'twitch'];
const FOLLOW = ['instagram', 'tiktok', 'facebook', 'twitter', 'x', 'threads', 'snapchat'];
const SHOP = ['shop', 'store', 'merch', 'bandsintown', 'tickets'];

export const CATEGORY_ORDER: BiolinkCategory[] = ['Listen', 'Watch', 'Follow', 'Shop', 'More'];

export function categorizeBiolinkPlatform(platform: string): BiolinkCategory {
  const p = platform.trim().toLowerCase();
  if (LISTEN.some((k) => p.includes(k))) return 'Listen';
  if (WATCH.some((k) => p.includes(k))) return 'Watch';
  if (FOLLOW.some((k) => p.includes(k))) return 'Follow';
  if (SHOP.some((k) => p.includes(k))) return 'Shop';
  return 'More';
}
