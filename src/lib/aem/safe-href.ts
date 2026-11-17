const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Author-supplied URLs go into `href` attributes. React does not block `javascript:` there.
 * Returns the trimmed URL when it is relative or http(s)/mailto/tel, otherwise undefined.
 * (This is the reference solution of Lab 16, Task 4, kept here so later labs can rely on it.)
 */
export function safeHref(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  // Browsers ignore control characters and whitespace inside a URL scheme: "java\tscript:" still runs.
  const collapsed = trimmed.replace(/[\u0000- \u007f]+/g, "");
  if (!collapsed) return undefined;
  if (/^[/#?]/.test(collapsed)) return trimmed;
  const scheme = /^([a-z][a-z0-9+.-]*:)/i.exec(collapsed)?.[1].toLowerCase();
  if (scheme) return ALLOWED_SCHEMES.has(scheme) ? trimmed : undefined;
  return trimmed;
}
