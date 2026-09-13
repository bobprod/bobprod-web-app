import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { verifyCredentials, issueSessionCookie, clearSessionCookie, isSessionValid, requireAdmin } from './auth.ts';
import {
  tracks,
  events,
  bookings,
  biolinks,
  theme,
  seoSettings,
  subscribers,
  pageBlocks,
  PAGE_SLUGS,
  BLOCK_TYPES,
  type Booking,
  type PageSlug,
  type BlockType,
} from './repositories.ts';
import { getSetting } from './db.ts';
import { isNonEmptyString, isSafeUrl } from './validation.ts';
import {
  getAdminConfig,
  setAdminConfig,
  getPublicConfig as getPublicTrackingConfig,
  fireBookingConversionEvents,
  listConversionEvents,
  type AdminTrackingConfig,
} from './marketingRepository.ts';
import {
  providers,
  getOrCreateConversation,
  appendMessage,
  listMessages,
  chatbotSettings,
} from './assistantRepository.ts';
import { resolve as resolveLLMClient } from './llm/factory.ts';
import type { ProviderType } from './llm/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const app = express();
// CSP is explicitly disabled for now: the content-blocks feature embeds youtube/soundcloud
// iframes and a real CSP needs careful allowlist tuning that's out of scope for this pass.
// The rest of helmet's defaults (nosniff, frameguard, HSTS, hide-powered-by, referrer-policy) are safe to enable as-is.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));

const uploadStorage = multer.diskStorage({
  destination: UPLOADS_DIR,
  // Keep the original extension so express.static can infer a correct Content-Type
  // (a bare hash filename is served as application/octet-stream, which browsers may
  // refuse to play/render as audio or images).
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
// Restricts uploads to the track-audio and cover/avatar-image types the site actually serves.
// Without this, express.static('/uploads') would serve back an uploaded .html/.svg with a
// sniffed content-type — a same-origin stored-XSS vector.
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);
const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});
// multer's fileFilter/limit errors are passed to next(err) inside the upload middleware itself,
// which would otherwise fall through to the generic 500 error handler — wrap the route's upload
// step so a rejected file type comes back as a clean 400 instead.
function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed' });
      return;
    }
    next();
  });
}

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const bookingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
// Guards the BYOK provider key from cost-abuse via the public chat endpoint.
const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
// Disk-exhaustion guard — no reason to allow unlimited uploads even from an authenticated admin.
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
// Each call makes a real outbound request to a configured LLM provider (costs real API quota/money).
const providerTestLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
// Public signup form — keep it generous enough for real visitors but block scripted abuse.
const newsletterLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_PROVIDER_TYPES: ProviderType[] = ['openrouter', 'openai', 'anthropic', 'custom'];

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
  const { title, artist } = req.body ?? {};
  if (!isNonEmptyString(title)) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  if (!isNonEmptyString(artist)) {
    res.status(400).json({ error: 'artist is required' });
    return;
  }
  res.status(201).json(tracks.create(req.body));
});
app.put('/api/admin/tracks/:id', requireAdmin, (req, res) => {
  const { title, artist } = req.body ?? {};
  if (title !== undefined && !isNonEmptyString(title)) {
    res.status(400).json({ error: 'title must be a non-empty string' });
    return;
  }
  if (artist !== undefined && !isNonEmptyString(artist)) {
    res.status(400).json({ error: 'artist must be a non-empty string' });
    return;
  }
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
  const { venue, ticket_url } = req.body ?? {};
  if (!isNonEmptyString(venue)) {
    res.status(400).json({ error: 'venue is required' });
    return;
  }
  // ticket_url is optional — only validate it when a non-empty value is actually provided.
  if (ticket_url !== undefined && ticket_url !== null && ticket_url !== '' && !isSafeUrl(ticket_url)) {
    res.status(400).json({ error: 'ticket_url must be a valid http(s) or mailto URL' });
    return;
  }
  res.status(201).json(events.create(req.body));
});
app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const { venue, ticket_url } = req.body ?? {};
  if (venue !== undefined && !isNonEmptyString(venue)) {
    res.status(400).json({ error: 'venue must be a non-empty string' });
    return;
  }
  if (ticket_url !== undefined && ticket_url !== null && ticket_url !== '' && !isSafeUrl(ticket_url)) {
    res.status(400).json({ error: 'ticket_url must be a valid http(s) or mailto URL' });
    return;
  }
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
  const { platform, label, url } = req.body ?? {};
  if (!isNonEmptyString(platform)) {
    res.status(400).json({ error: 'platform is required' });
    return;
  }
  if (!isNonEmptyString(label)) {
    res.status(400).json({ error: 'label is required' });
    return;
  }
  if (!isSafeUrl(url)) {
    res.status(400).json({ error: 'url must be a valid http(s) or mailto URL' });
    return;
  }
  res.status(201).json(biolinks.create(req.body));
});
app.put('/api/admin/biolinks/:id', requireAdmin, (req, res) => {
  const { platform, label, url } = req.body ?? {};
  if (platform !== undefined && !isNonEmptyString(platform)) {
    res.status(400).json({ error: 'platform must be a non-empty string' });
    return;
  }
  if (label !== undefined && !isNonEmptyString(label)) {
    res.status(400).json({ error: 'label must be a non-empty string' });
    return;
  }
  if (url !== undefined && !isSafeUrl(url)) {
    res.status(400).json({ error: 'url must be a valid http(s) or mailto URL' });
    return;
  }
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

// ---------- admin: assistant / LLM providers ----------

app.get('/api/admin/assistant/providers', requireAdmin, (_req, res) => {
  res.json(providers.list());
});

app.post('/api/admin/assistant/providers', requireAdmin, (req, res) => {
  const { label, providerType, apiKey, modelId, isActive } = req.body ?? {};
  if (typeof label !== 'string' || !label.trim()) {
    res.status(400).json({ error: 'label is required' });
    return;
  }
  if (typeof providerType !== 'string' || !VALID_PROVIDER_TYPES.includes(providerType as ProviderType)) {
    res.status(400).json({ error: `providerType must be one of ${VALID_PROVIDER_TYPES.join(', ')}` });
    return;
  }
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    res.status(400).json({ error: 'apiKey is required' });
    return;
  }
  if (typeof modelId !== 'string' || !modelId.trim()) {
    res.status(400).json({ error: 'modelId is required' });
    return;
  }
  const created = providers.create({
    label: label.trim(),
    providerType: providerType as ProviderType,
    apiKey: apiKey.trim(),
    modelId: modelId.trim(),
    isActive: isActive === undefined ? true : Boolean(isActive),
  });
  res.status(201).json(created);
});

app.put('/api/admin/assistant/providers/:id', requireAdmin, (req, res) => {
  const { label, providerType, apiKey, modelId, isActive } = req.body ?? {};
  if (providerType !== undefined && !VALID_PROVIDER_TYPES.includes(providerType as ProviderType)) {
    res.status(400).json({ error: `providerType must be one of ${VALID_PROVIDER_TYPES.join(', ')}` });
    return;
  }
  try {
    const updated = providers.update(Number(req.params.id), {
      label: typeof label === 'string' ? label.trim() : undefined,
      providerType: typeof providerType === 'string' ? (providerType as ProviderType) : undefined,
      // Empty/omitted apiKey means "keep the existing key" — enforced in the repository layer too.
      apiKey: typeof apiKey === 'string' && apiKey.trim() !== '' ? apiKey.trim() : undefined,
      modelId: typeof modelId === 'string' ? modelId.trim() : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Provider not found' });
  }
});

app.delete('/api/admin/assistant/providers/:id', requireAdmin, (req, res) => {
  try {
    providers.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Cannot delete provider' });
  }
});

app.put('/api/admin/assistant/providers/:id/default', requireAdmin, (req, res) => {
  try {
    const updated = providers.setDefault(Number(req.params.id));
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Provider not found' });
  }
});

app.post('/api/admin/assistant/providers/:id/test', requireAdmin, providerTestLimiter, async (req, res) => {
  const provider = providers.getDecrypted(Number(req.params.id));
  if (!provider) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }
  const start = Date.now();
  try {
    const client = resolveLLMClient(provider.providerType, provider.apiKey);
    await client.send([{ role: 'user', content: 'Say "pong" and nothing else.' }], provider.modelId);
    res.json({ success: true, latencyMs: Date.now() - start });
  } catch (err) {
    res.json({
      success: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// ---------- admin: chatbot settings ----------

app.put('/api/admin/settings/chatbot', requireAdmin, (req, res) => {
  const { enabled, systemPrompt } = req.body ?? {};
  if (typeof enabled !== 'boolean') {
    res.status(400).json({ error: 'enabled must be a boolean' });
    return;
  }
  if (systemPrompt !== undefined && typeof systemPrompt !== 'string') {
    res.status(400).json({ error: 'systemPrompt must be a string' });
    return;
  }
  res.json(chatbotSettings.set(enabled, systemPrompt));
});

app.get('/api/admin/settings/chatbot', requireAdmin, (_req, res) => {
  res.json(chatbotSettings.get());
});

// ---------- admin: seo settings ----------

app.put('/api/admin/settings/seo', requireAdmin, (req, res) => {
  const { title, description } = req.body ?? {};
  if (title !== undefined && typeof title !== 'string') {
    res.status(400).json({ error: 'title must be a string' });
    return;
  }
  if (description !== undefined && typeof description !== 'string') {
    res.status(400).json({ error: 'description must be a string' });
    return;
  }
  res.json(seoSettings.set({ title, description }));
});

// ---------- admin: theme ----------

app.get('/api/admin/theme', requireAdmin, (_req, res) => {
  res.json(theme.get());
});
app.put('/api/admin/theme', requireAdmin, (req, res) => {
  res.json(theme.set(req.body));
});

// ---------- admin: marketing / tracking ----------

app.get('/api/admin/marketing', requireAdmin, (_req, res) => {
  res.json(getAdminConfig());
});

app.put('/api/admin/marketing', requireAdmin, (req, res) => {
  res.json(setAdminConfig(req.body as AdminTrackingConfig));
});

app.get('/api/admin/marketing/events', requireAdmin, (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  res.json(listConversionEvents(page, pageSize));
});

app.post('/api/admin/marketing/seo-suggest', requireAdmin, async (req, res) => {
  const { route } = req.body ?? {};
  if (typeof route !== 'string' || !route.trim()) {
    res.status(400).json({ error: 'route is required' });
    return;
  }
  const defaultProvider = providers.getDefaultActive();
  if (!defaultProvider) {
    res.status(409).json({ error: 'No default Assistant provider is configured' });
    return;
  }
  try {
    const client = resolveLLMClient(defaultProvider.providerType, defaultProvider.apiKey);
    const prompt =
      `Write a concise SEO title (under 60 characters) and meta description (under 155 characters) ` +
      `for the "${route}" page of bobprod, a house & techno DJ/producer's website. ` +
      `Respond with exactly two lines: "Title: ..." then "Description: ...". No other text.`;
    const result = await client.send([{ role: 'user', content: prompt }], defaultProvider.modelId);
    const titleMatch = result.reply.match(/Title:\s*(.+)/i);
    const descMatch = result.reply.match(/Description:\s*(.+)/i);
    res.json({
      title: titleMatch?.[1]?.trim() ?? '',
      description: descMatch?.[1]?.trim() ?? '',
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'SEO suggestion failed' });
  }
});

// ---------- admin: page blocks ----------

app.get('/api/admin/blocks', requireAdmin, (req, res) => {
  const page = req.query.page as string | undefined;
  if (page !== undefined && !PAGE_SLUGS.includes(page as PageSlug)) {
    res.status(400).json({ error: `page must be one of ${PAGE_SLUGS.join(', ')}` });
    return;
  }
  res.json(pageBlocks.list(page as PageSlug | undefined));
});

app.post('/api/admin/blocks', requireAdmin, (req, res) => {
  const { page, blockType } = req.body ?? {};
  if (!PAGE_SLUGS.includes(page)) {
    res.status(400).json({ error: `page must be one of ${PAGE_SLUGS.join(', ')}` });
    return;
  }
  if (!BLOCK_TYPES.includes(blockType)) {
    res.status(400).json({ error: `blockType must be one of ${BLOCK_TYPES.join(', ')}` });
    return;
  }
  try {
    const created = pageBlocks.create(page as PageSlug, blockType as BlockType);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Cannot create block' });
  }
});

app.put('/api/admin/blocks/reorder', requireAdmin, (req, res) => {
  const { page, orderedIds } = req.body ?? {};
  if (!PAGE_SLUGS.includes(page)) {
    res.status(400).json({ error: `page must be one of ${PAGE_SLUGS.join(', ')}` });
    return;
  }
  if (!Array.isArray(orderedIds) || !orderedIds.every((id) => typeof id === 'number')) {
    res.status(400).json({ error: 'orderedIds must be an array of numbers' });
    return;
  }
  res.json(pageBlocks.reorder(page as PageSlug, orderedIds));
});

app.put('/api/admin/blocks/:id', requireAdmin, (req, res) => {
  const config = req.body?.config;
  if (typeof config !== 'object' || config === null) {
    res.status(400).json({ error: 'config must be an object' });
    return;
  }
  try {
    res.json(pageBlocks.updateConfig(Number(req.params.id), config));
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Block not found' });
  }
});

app.put('/api/admin/blocks/:id/enabled', requireAdmin, (req, res) => {
  const { enabled } = req.body ?? {};
  if (typeof enabled !== 'boolean') {
    res.status(400).json({ error: 'enabled must be a boolean' });
    return;
  }
  try {
    res.json(pageBlocks.setEnabled(Number(req.params.id), enabled));
  } catch (err) {
    res.status(404).json({ error: err instanceof Error ? err.message : 'Block not found' });
  }
});

app.delete('/api/admin/blocks/:id', requireAdmin, (req, res) => {
  pageBlocks.remove(Number(req.params.id));
  res.status(204).end();
});

// ---------- admin: uploads ----------

app.post('/api/admin/uploads', requireAdmin, uploadLimiter, handleUpload, (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// ---------- admin: newsletter subscribers ----------

app.get('/api/admin/subscribers', requireAdmin, (_req, res) => {
  res.json(subscribers.list());
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
app.get('/api/public/blocks', (req, res) => {
  const page = req.query.page as string | undefined;
  if (!page || !PAGE_SLUGS.includes(page as PageSlug)) {
    res.status(400).json({ error: `page must be one of ${PAGE_SLUGS.join(', ')}` });
    return;
  }
  res.json(pageBlocks.listEnabled(page as PageSlug));
});

app.get('/api/public-config', (_req, res) => {
  res.json({
    seo: getSetting('seo', {}),
    tracking: getPublicTrackingConfig(),
    chatbotEnabled: getSetting('chatbotEnabled', false),
    theme: theme.get(),
  });
});

// ---------- public: booking request ----------

app.post('/api/bookings', bookingLimiter, (req, res) => {
  const { name, email, event_type, requested_date, venue, message, marketingConsent } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  const created = bookings.create({
    name: name.trim(),
    email: email.trim(),
    event_type: event_type ?? null,
    requested_date: requested_date ?? null,
    venue: venue ?? null,
    message: message ?? null,
  });
  res.status(201).json(created);

  // Fire-and-forget: conversion sends must never delay or fail the visitor-facing response above.
  fireBookingConversionEvents(created.id, Boolean(marketingConsent)).catch((err) => {
    console.error('Conversion event dispatch failed:', err instanceof Error ? err.message : err);
  });
});

// ---------- public: newsletter signup ----------

app.post('/api/newsletter', newsletterLimiter, (req, res) => {
  const { email, source } = req.body ?? {};
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }
  subscribers.create(email.trim(), typeof source === 'string' && source.trim() ? source.trim() : null);
  // Always looks like success to the caller, including the duplicate-email case — don't leak
  // whether an address is already subscribed.
  res.status(201).json({ ok: true });
});

// ---------- public: chat ----------

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { enabled } = chatbotSettings.get();
  const defaultProvider = providers.getDefaultActive();
  // Defense in depth: if the feature is off or unconfigured, don't reveal that it exists.
  if (!enabled || !defaultProvider) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const { message, sessionId } = req.body ?? {};
  if (typeof message !== 'string' || !message.trim() || typeof sessionId !== 'string' || !sessionId.trim()) {
    res.status(400).json({ error: 'message and sessionId are required' });
    return;
  }

  const conversation = getOrCreateConversation(sessionId.trim());
  appendMessage(conversation.id, 'user', message.trim(), null, null);

  const history = listMessages(conversation.id).map((m) => ({ role: m.role, content: m.content }));
  const { systemPrompt } = chatbotSettings.get();

  try {
    const client = resolveLLMClient(defaultProvider.providerType, defaultProvider.apiKey);
    const result = await client.send(history, defaultProvider.modelId, systemPrompt || undefined);
    appendMessage(conversation.id, 'assistant', result.reply, defaultProvider.id, result.tokensUsed ?? null);
    res.json({ reply: result.reply });
  } catch (err) {
    console.error('Chat provider call failed:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'The assistant is temporarily unavailable. Please try again.' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------- global error handler ----------
// Must be registered last. Express 5 auto-forwards both synchronous throws and rejected
// promises from route handlers here (4-arg signature), so any unvalidated-type crash (e.g. a
// wrong-type value hitting node:sqlite's parameter binding) returns a clean generic message
// instead of leaking a stack trace, regardless of NODE_ENV.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`bobprod API listening on http://localhost:${PORT}`);
});
