import { createHash } from "node:crypto";
import type {
  Asset,
  RichText,
  RichTextBlockNode,
  RichTextFragmentReferenceNode,
  RichTextHeaderNode,
  RichTextLinkNode,
  RichTextNode,
  RichTextAssetReferenceNode,
  RichTextTextNode,
  TextVariant,
} from "../types";

export const DAM_ROOT = "/content/dam/wknd-shared";

/** Deterministic UUID so `_id` values and Dynamic Media URLs are stable across restarts. */
export function uuidFor(input: string): string {
  const hex = createHash("sha1").update(input).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function hueFor(input: string): number {
  return Number.parseInt(createHash("md5").update(input).digest("hex").slice(0, 4), 16) % 360;
}

/* -------------------------------------------------------------------------- */
/* Asset registry                                                              */
/* -------------------------------------------------------------------------- */

export const assetRegistry = new Map<string, Asset>();

export function image(
  assetPath: string,
  options: { title: string; width?: number; height?: number; scene?: Asset["scene"] },
): string {
  // Language copies reference the same DAM asset — keep the first registration.
  if (assetRegistry.has(assetPath)) return assetPath;
  const width = options.width ?? 1920;
  const height = options.height ?? 1280;
  assetRegistry.set(assetPath, {
    path: assetPath,
    id: uuidFor(`asset:${assetPath}`),
    kind: "image",
    mimeType: "image/jpeg",
    title: options.title,
    width,
    height,
    // Fake but plausible JPEG size.
    size: Math.round(width * height * 0.18),
    hue: hueFor(assetPath),
    scene: options.scene ?? "mountains",
  });
  return assetPath;
}

export function pdf(assetPath: string, title: string): string {
  if (assetRegistry.has(assetPath)) return assetPath;
  assetRegistry.set(assetPath, {
    path: assetPath,
    id: uuidFor(`asset:${assetPath}`),
    kind: "document",
    mimeType: "application/pdf",
    title,
    size: 48_213 + (hueFor(assetPath) * 97),
    hue: hueFor(assetPath),
  });
  return assetPath;
}

/* -------------------------------------------------------------------------- */
/* Rich text builders (Multi line text fields)                                 */
/* -------------------------------------------------------------------------- */

type Inline = string | RichTextNode;

const toInline = (part: Inline): RichTextNode =>
  typeof part === "string" ? { nodeType: "text", value: part } : part;

export const rt = (...nodes: RichTextNode[]): RichText => ({ __richText: true, nodes });

export const text = (value: string, variants?: TextVariant[]): RichTextTextNode =>
  variants?.length ? { nodeType: "text", value, format: { variants } } : { nodeType: "text", value };

export const b = (value: string) => text(value, ["bold"]);
export const i = (value: string) => text(value, ["italic"]);
export const u = (value: string) => text(value, ["underline"]);

export const p = (...parts: Inline[]): RichTextBlockNode => ({
  nodeType: "paragraph",
  content: parts.map(toInline),
});

export const h = (level: 1 | 2 | 3 | 4, ...parts: Inline[]): RichTextHeaderNode => ({
  nodeType: "header",
  style: `h${level}`,
  content: parts.map(toInline),
});

const list = (nodeType: "unordered-list" | "ordered-list", items: (Inline | Inline[])[]): RichTextBlockNode => ({
  nodeType,
  content: items.map((item) => ({
    nodeType: "list-item",
    content: (Array.isArray(item) ? item : [item]).map(toInline),
  })),
});

export const ul = (...items: (Inline | Inline[])[]) => list("unordered-list", items);
export const ol = (...items: (Inline | Inline[])[]) => list("ordered-list", items);

export const link = (href: string, value: string, target?: "_blank"): RichTextLinkNode => ({
  nodeType: "link",
  value,
  data: target ? { href, target } : { href },
});

/** An image dropped into the rich text editor ("Insert asset"). */
export const inlineImage = (assetPath: string): RichTextAssetReferenceNode => ({
  nodeType: "reference",
  data: { path: assetPath, mimetype: "image/jpeg" },
});

/** A content fragment linked from the rich text editor ("Insert content fragment"). */
export const fragmentLink = (fragmentPath: string, value: string): RichTextFragmentReferenceNode => ({
  nodeType: "reference",
  value,
  data: { href: fragmentPath, type: "fragment" },
});
