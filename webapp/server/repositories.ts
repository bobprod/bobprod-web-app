import { db, getSetting, setSetting } from './db.ts';

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

const DEFAULT_THEME: Theme = { accentRed: '#d1382a', accentGold: '#f0a91f', bgColor: '#0a0a0a' };

// ---------- tracks ----------

export const tracks = {
  list(): Track[] {
    return db.prepare('SELECT * FROM tracks ORDER BY sort_order ASC, id ASC').all() as unknown as Track[];
  },
  create(data: Omit<Track, 'id'>): Track {
    const info = db
      .prepare(
        'INSERT INTO tracks (title, artist, audio_url, cover_url, sort_order) VALUES (?, ?, ?, ?, ?)',
      )
      .run(data.title, data.artist, data.audio_url, data.cover_url, data.sort_order);
    return db.prepare('SELECT * FROM tracks WHERE id = ?').get(info.lastInsertRowid) as unknown as Track;
  },
  update(id: number, patch: Partial<Omit<Track, 'id'>>): Track | undefined {
    const current = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as unknown as Track | undefined;
    if (!current) return undefined;
    const next = { ...current, ...patch };
    db.prepare(
      'UPDATE tracks SET title = ?, artist = ?, audio_url = ?, cover_url = ?, sort_order = ? WHERE id = ?',
    ).run(next.title, next.artist, next.audio_url, next.cover_url, next.sort_order, id);
    return db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as unknown as Track;
  },
  remove(id: number) {
    db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
  },
};

// ---------- events ----------

export const events = {
  list(): EventItem[] {
    return db.prepare('SELECT * FROM events ORDER BY event_date ASC').all() as unknown as EventItem[];
  },
  listPublished(): EventItem[] {
    return db
      .prepare('SELECT * FROM events WHERE is_published = 1 ORDER BY event_date ASC')
      .all() as unknown as EventItem[];
  },
  create(data: Omit<EventItem, 'id'>): EventItem {
    const info = db
      .prepare(
        'INSERT INTO events (event_date, venue, city, ticket_url, is_published) VALUES (?, ?, ?, ?, ?)',
      )
      .run(data.event_date, data.venue, data.city, data.ticket_url, data.is_published);
    return db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid) as unknown as EventItem;
  },
  update(id: number, patch: Partial<Omit<EventItem, 'id'>>): EventItem | undefined {
    const current = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as unknown as EventItem | undefined;
    if (!current) return undefined;
    const next = { ...current, ...patch };
    db.prepare(
      'UPDATE events SET event_date = ?, venue = ?, city = ?, ticket_url = ?, is_published = ? WHERE id = ?',
    ).run(next.event_date, next.venue, next.city, next.ticket_url, next.is_published, id);
    return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as unknown as EventItem;
  },
  remove(id: number) {
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
  },
};

// ---------- bookings ----------

export const bookings = {
  list(): Booking[] {
    return db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all() as unknown as Booking[];
  },
  create(data: Omit<Booking, 'id' | 'status' | 'created_at'>): Booking {
    const info = db
      .prepare(
        'INSERT INTO bookings (name, email, event_type, requested_date, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(data.name, data.email, data.event_type, data.requested_date, data.message, 'pending');
    return db.prepare('SELECT * FROM bookings WHERE id = ?').get(info.lastInsertRowid) as unknown as Booking;
  },
  setStatus(id: number, status: Booking['status']): Booking | undefined {
    const current = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as unknown as Booking | undefined;
    if (!current) return undefined;
    // status invariant: pending -> confirmed|declined only, no reopening
    if (current.status !== 'pending') return current;
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
    return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as unknown as Booking;
  },
};

// ---------- biolinks ----------

export const biolinks = {
  list(): Biolink[] {
    return db.prepare('SELECT * FROM biolinks ORDER BY sort_order ASC, id ASC').all() as unknown as Biolink[];
  },
  listEnabled(): Biolink[] {
    return db
      .prepare('SELECT * FROM biolinks WHERE is_enabled = 1 ORDER BY sort_order ASC, id ASC')
      .all() as unknown as Biolink[];
  },
  create(data: Omit<Biolink, 'id' | 'is_enabled'> & { is_enabled?: number }): Biolink {
    const info = db
      .prepare('INSERT INTO biolinks (platform, label, url, sort_order, is_enabled) VALUES (?, ?, ?, ?, ?)')
      .run(data.platform, data.label, data.url, data.sort_order, data.is_enabled ?? 1);
    return db.prepare('SELECT * FROM biolinks WHERE id = ?').get(info.lastInsertRowid) as unknown as Biolink;
  },
  update(id: number, patch: Partial<Omit<Biolink, 'id'>>): Biolink | undefined {
    const current = db.prepare('SELECT * FROM biolinks WHERE id = ?').get(id) as unknown as Biolink | undefined;
    if (!current) return undefined;
    const next = { ...current, ...patch };
    db.prepare(
      'UPDATE biolinks SET platform = ?, label = ?, url = ?, sort_order = ?, is_enabled = ? WHERE id = ?',
    ).run(next.platform, next.label, next.url, next.sort_order, next.is_enabled, id);
    return db.prepare('SELECT * FROM biolinks WHERE id = ?').get(id) as unknown as Biolink;
  },
  remove(id: number) {
    db.prepare('DELETE FROM biolinks WHERE id = ?').run(id);
  },
};

// ---------- theme ----------

export const theme = {
  get(): Theme {
    return getSetting('theme', DEFAULT_THEME);
  },
  set(next: Theme) {
    setSetting('theme', next);
    return next;
  },
};
