import { useEffect, useRef, useState } from 'react';
import { usePublicConfig } from '../lib/publicConfig';
import { ApiError, api } from '../lib/api';

const SESSION_KEY = 'bobprod_chat_session_id';

interface ChatEntry {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function ChatWidget() {
  const { chatbotEnabled } = usePublicConfig();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  if (!chatbotEnabled) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const { reply } = await api.post<{ reply: string }>('/api/chat', {
        message: text,
        sessionId: getOrCreateSessionId(),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong, try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: message, error: true }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[420px] w-[min(340px,88vw)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141312]/95 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-display text-sm text-white">Ask bobprod</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-xs text-white/40">Ask about music, shows, or booking — I'll do my best to help.</p>
            )}
            <div className="flex flex-col gap-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'ml-auto bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] text-white'
                      : m.error
                        ? 'border border-red-500/30 bg-red-500/10 text-red-300'
                        : 'border border-white/10 bg-white/5 text-white/90'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {sending && <div className="text-xs text-white/40">Thinking…</div>}
            </div>
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-lg bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] text-xl text-white shadow-lg transition-[filter] hover:brightness-110"
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
