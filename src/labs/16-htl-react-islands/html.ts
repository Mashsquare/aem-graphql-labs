/**
 * Provided — a tiny stand-in for the browser's DOM, so the lab runs in Node.
 *
 * `parseMountPoints(html)` finds every element with `data-react-component` in a page that AEM
 * rendered with HTL, and every `<script type="application/json">`. It returns an object with the
 * two methods of `document` that your code needs. (In the browser you pass `document` itself.)
 */
import type { IslandElement, IslandHost } from "./types";

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** HTL escapes attribute values (" -> &#34;). The browser decodes them for you; here we do it. */
export function decodeEntities(value: string): string {
  return value.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(\w+));/gi, (match, dec, hex, name) =>
    dec ? String.fromCodePoint(Number(dec)) : hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : (entities[name] ?? match),
  );
}

const camel = (attribute: string) => attribute.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());

export interface FakeElement extends IslandElement {
  tag: string;
  /** The markup of the opening tag, for display. */
  source: string;
}

export interface FakeDocument extends IslandHost {
  elements: FakeElement[];
}

/** Supports the selectors this lab uses: `[data-a]`, `[data-a]:not([data-b])`. */
function matches(element: FakeElement, selector: string): boolean {
  const positive = [...selector.replace(/:not\(\[[^\]]+\]\)/g, "").matchAll(/\[data-([a-z0-9-]+)\]/g)].map((match) => camel(match[1]));
  const negative = [...selector.matchAll(/:not\(\[data-([a-z0-9-]+)\]\)/g)].map((match) => camel(match[1]));
  return positive.every((key) => element.dataset[key] !== undefined) && negative.every((key) => element.dataset[key] === undefined);
}

export function parseMountPoints(html: string): FakeDocument {
  const elements: FakeElement[] = [];
  for (const tag of html.matchAll(/<(\w+)([^>]*\sdata-react-component=[^>]*)>/g)) {
    const dataset: Record<string, string | undefined> = {};
    for (const attribute of tag[2].matchAll(/\s(data-[\w-]+)(?:="([^"]*)"|='([^']*)')?/g)) {
      dataset[camel(attribute[1].slice("data-".length))] = decodeEntities(attribute[2] ?? attribute[3] ?? "");
    }
    elements.push({ tag: tag[1], source: tag[0], dataset });
  }
  const scripts = new Map<string, string>();
  for (const script of html.matchAll(/<script type="application\/json" id="([^"]+)">([\s\S]*?)<\/script>/g)) {
    scripts.set(script[1], script[2]);
  }
  return {
    elements,
    querySelectorAll: (selector) => elements.filter((element) => matches(element, selector)),
    getElementById: (id) => (scripts.has(id) ? { textContent: scripts.get(id)! } : null),
  };
}

/** Builds a fake element from a dataset, for tests. */
export function fakeElement(dataset: Record<string, string>): FakeElement {
  return { tag: "div", source: "<div>", dataset: { ...dataset } };
}

export function fakeDocument(elements: FakeElement[], scripts: Record<string, string> = {}): FakeDocument {
  return {
    elements,
    querySelectorAll: (selector) => elements.filter((element) => matches(element, selector)),
    getElementById: (id) => (id in scripts ? { textContent: scripts[id] } : null),
  };
}
