const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

export function safeHref(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  // Browsers drop tabs, newlines and other control characters inside URLs: "java\tscript:" still runs.
  const collapsed = trimmed.replace(/[\u0000- \u007f]+/g, "");
  if (!collapsed) return undefined;
  if (/^[/#?]/.test(collapsed)) return trimmed;
  const scheme = /^([a-z][a-z0-9+.-]*:)/i.exec(collapsed)?.[1].toLowerCase();
  if (scheme) return ALLOWED_SCHEMES.has(scheme) ? trimmed : undefined;
  return trimmed; // "adventures/bali.html": relative, no scheme
}
