import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyCredentials, issueSessionCookie, clearSessionCookie, isSessionValid, requireAdmin } from './auth.ts';
import { tracks, events, bookings, biolinks, theme, type Booking } from './repositories.ts';
import { getSetting } from './db.ts';
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
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));

const upload = multer({ dest: UPLOADS_DIR, limits: { fileSize: 25 * 1024 * 1024 } });

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const bookingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
// Guards the BYOK provider key from cost-abuse via the public chat endpoint.
const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

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

app.post('/api/admin/assistant/providers/:id/test', requireAdmin, async (req, res) => {
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

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`bobprod API listening on http://localhost:${PORT}`);
});
