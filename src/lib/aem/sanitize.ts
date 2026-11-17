/**
 * Allow-list sanitiser for the rich text HTML in `.model.json` exports (reference solution of Lab 17,
 * Task 3). Teaching code: in production use DOMPurify or sanitize-html.
 */
import { safeHref } from "./safe-href";

const ALLOWED = new Set(["p", "br", "b", "strong", "i", "em", "u", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote"]);
const VOID = new Set(["br"]);
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "template", "noscript", "svg", "math"]);
const TOKEN = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^\s/>]*(?:"[^"]*"|'[^']*'|[^'">])*>/g;

const escapeText = (text: string) => text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attribute = (tag: string, name: string) =>
  new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i").exec(tag)?.slice(1).find((value) => value !== undefined);

/**
 * Attribute values are HTML-encoded and the browser decodes them BEFORE it looks at the URL scheme:
 * href="&#106;avascript:…" and href="javascript&colon;…" both run. So decode first, and refuse any
 * named entity we did not decode ourselves.
 */
function decodeAttribute(value: string): string | undefined {
  const decoded = value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&(quot|apos|lt|gt);/gi, (_, name: string) => ({ quot: '"', apos: "'", lt: "<", gt: ">" })[name.toLowerCase()]!)
    .replace(/&amp;/gi, "&");
  return /&[a-z][a-z0-9]*;/i.test(decoded) ? undefined : decoded; // &colon; &Tab; &NewLine; …
}

export function sanitizeRichText(html: string): string {
  let output = "";
  const open: string[] = [];
  let dropping: string | null = null;
  let last = 0;

  const text = (value: string) => {
    if (!dropping) output += escapeText(value);
  };

  for (const match of html.matchAll(TOKEN)) {
    text(html.slice(last, match.index));
    last = match.index + match[0].length;
    const token = match[0];
    if (token.startsWith("<!--")) continue;

    const closing = token.startsWith("</");
    const name = /^<\/?([a-zA-Z][^\s/>]*)/.exec(token)![1].toLowerCase();

    if (dropping) {
      if (closing && name === dropping) dropping = null;
      continue;
    }
    if (DROP_WITH_CONTENT.has(name)) {
      if (!closing && !token.endsWith("/>")) dropping = name;
      continue;
    }
    if (!ALLOWED.has(name)) continue; // unknown tag: drop the tag, keep its text

    if (closing) {
      const index = open.lastIndexOf(name);
      if (index === -1) continue; // unmatched closing tag
      // Close anything left open inside it, so the output stays well nested.
      for (const inner of open.splice(index).reverse()) output += `</${inner}>`;
      continue;
    }

    let tag = `<${name}`;
    if (name === "a") {
      const rawHref = attribute(token, "href");
      const href = safeHref(rawHref === undefined ? undefined : decodeAttribute(rawHref));
      if (href) tag += ` href="${href.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`;
      if (attribute(token, "target")?.toLowerCase() === "_blank") tag += ' target="_blank" rel="noopener noreferrer"';
    }
    output += `${tag}>`;
    if (!VOID.has(name)) open.push(name);
  }
  text(html.slice(last));
  for (const name of open.reverse()) output += `</${name}>`;
  return output;
}
