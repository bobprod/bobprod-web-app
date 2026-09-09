// Small shared request-validation helpers used across the admin CRUD routes in index.ts.

/** True only for a string that survives trimming — the standard "required text field" check. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * True only for a string that parses as a URL with an http:, https:, or mailto: protocol.
 * Used to keep `javascript:`/`data:`/etc payloads out of fields (biolinks.url, events.ticket_url)
 * that the public site renders as a raw `href`.
 */
export function isSafeUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return SAFE_URL_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}
