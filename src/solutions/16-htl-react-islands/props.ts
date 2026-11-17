import { PropsError, type IslandElement } from "@/labs/16-htl-react-islands/types";

/** Bookkeeping attributes — they describe the mount point, they are not props. */
const RESERVED = new Set(["reactComponent", "reactMounted", "props", "propsId", "cqDataPath"]);

export function coerceAttribute(value: string): unknown {
  if (value === "" || value === "true") return true; // HTL: ${true} -> bare attribute
  if (value === "false") return false;
  // No leading zeros, no exponents: "007" and "1e3" are identifiers, not numbers.
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return Number(value);
  if (/^[[{]/.test(value)) {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

function parseObject(text: string, source: string, component: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new PropsError(`${component}: ${source} is not valid JSON (${(error as Error).message})`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new PropsError(`${component}: ${source} must be a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

export function readProps(element: IslandElement, readScript: (id: string) => string | null): Record<string, unknown> {
  const component = element.dataset.reactComponent ?? "(unnamed component)";
  const { propsId, props } = element.dataset;

  if (propsId !== undefined) {
    const text = readScript(propsId);
    if (text === null) throw new PropsError(`${component}: <script id="${propsId}"> not found`);
    return parseObject(text, `script #${propsId}`, component);
  }
  if (props !== undefined) return parseObject(props, "data-props", component);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(element.dataset)) {
    if (value !== undefined && !RESERVED.has(key)) result[key] = coerceAttribute(value);
  }
  return result;
}
