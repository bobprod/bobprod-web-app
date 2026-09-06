import sanitizeHtml from 'sanitize-html';

const ALLOWED_IFRAME_HOSTS = ['www.youtube.com', 'www.youtube-nocookie.com', 'w.soundcloud.com'];

export function sanitizeBlockHtml(rawHtml: string): string {
  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['iframe', 'h1', 'h2', 'img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
      img: ['src', 'alt', 'width', 'height'],
      a: ['href', 'name', 'target', 'rel'],
    },
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
    // sanitize-html already strips <script> and all on* handlers by default via its allowlist
    // model (anything not explicitly allowed is dropped) — this config just widens the allowlist
    // slightly beyond the default text-only tags for embeds/images.
  });
}
