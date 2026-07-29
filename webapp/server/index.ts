import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyCredentials, issueSessionCookie, clearSessionCookie, isSessionValid, requireAdmin } from './auth.ts';
import { tracks, events, bookings, biolinks, theme, type Booking } from './repositories.ts';
import { getSetting } from './db.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));

const upload = multer({ dest: UPLOADS_DIR, limits: { fileSize: 25 * 1024 * 1024 } });

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const bookingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

// ---------- admin auth ----------

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  if (!verifyCredentials(username, password)) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }
  issueSessionCookie(res, username);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/admin/session', (req, res) => {
  res.json({ authenticated: isSessionValid(req) });
});

// ---------- admin CRUD: tracks ----------

app.get('/api/admin/tracks', requireAdmin, (_req, res) => {
  res.json(tracks.list());
});
app.post('/api/admin/tracks', requireAdmin, (req, res) => {
  res.status(201).json(tracks.create(req.body));
});
app.put('/api/admin/tracks/:id', requireAdmin, (req, res) => {
  const updated = tracks.update(Number(req.params.id), req.body);
  if (!updated) {
    res.status(404).json({ error: 'Track not found' });
    return;
  }
  res.json(updated);
});
app.delete('/api/admin/tracks/:id', requireAdmin, (req, res) => {
  tracks.remove(Number(req.params.id));
  res.status(204).end();
});

// ---------- admin CRUD: events ----------

app.get('/api/admin/events', requireAdmin, (_req, res) => {
  res.json(events.list());
});
app.post('/api/admin/events', requireAdmin, (req, res) => {
  res.status(201).json(events.create(req.body));
});
app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const updated = events.update(Number(req.params.id), req.body);
  if (!updated) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(updated);
});
app.delete('/api/admin/events/:id', requireAdmin, (req, res) => {
  events.remove(Number(req.params.id));
  res.status(204).end();
});

// ---------- admin: bookings (status change only) ----------

app.get('/api/admin/bookings', requireAdmin, (_req, res) => {
  res.json(bookings.list());
});
app.put('/api/admin/bookings/:id', requireAdmin, (req, res) => {
  const status = req.body?.status as Booking['status'];
  if (!['confirmed', 'declined'].includes(status)) {
    res.status(400).json({ error: 'status must be "confirmed" or "declined"' });
    return;
  }
  const updated = bookings.setStatus(Number(req.params.id), status);
  if (!updated) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  res.json(updated);
});

// ---------- admin CRUD: biolinks ----------

app.get('/api/admin/biolinks', requireAdmin, (_req, res) => {
  res.json(biolinks.list());
});
app.post('/api/admin/biolinks', requireAdmin, (req, res) => {
  res.status(201).json(biolinks.create(req.body));
});
app.put('/api/admin/biolinks/:id', requireAdmin, (req, res) => {
  const updated = biolinks.update(Number(req.params.id), req.body);
  if (!updated) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  res.json(updated);
});
app.delete('/api/admin/biolinks/:id', requireAdmin, (req, res) => {
  biolinks.remove(Number(req.params.id));
  res.status(204).end();
});

// ---------- admin: theme ----------

app.get('/api/admin/theme', requireAdmin, (_req, res) => {
  res.json(theme.get());
});
app.put('/api/admin/theme', requireAdmin, (req, res) => {
  res.json(theme.set(req.body));
});

// ---------- admin: uploads ----------

app.post('/api/admin/uploads', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// ---------- public reads ----------

app.get('/api/public/tracks', (_req, res) => {
  res.json(tracks.list());
});
app.get('/api/public/events', (_req, res) => {
  res.json(events.listPublished());
});
app.get('/api/public/biolinks', (_req, res) => {
  res.json(biolinks.listEnabled());
});

app.get('/api/public-config', (_req, res) => {
  res.json({
    seo: getSetting('seo', {}),
    tracking: getSetting('tracking', {}),
    chatbotEnabled: getSetting('chatbotEnabled', false),
    theme: theme.get(),
  });
});

// ---------- public: booking request ----------

app.post('/api/bookings', bookingLimiter, (req, res) => {
  const { name, email, event_type, requested_date, message } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  const created = bookings.create({
    name: name.trim(),
    email: email.trim(),
    event_type: event_type ?? null,
    requested_date: requested_date ?? null,
    message: message ?? null,
  });
  res.status(201).json(created);
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`bobprod API listening on http://localhost:${PORT}`);
});
