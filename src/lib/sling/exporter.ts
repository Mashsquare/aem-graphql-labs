/**
 * Reference implementation of the Sling Model Exporter (Jackson flavour) and the pieces around it.
 * Lab 23 has you write these yourself; the lib keeps working copies so earlier labs can use them.
 */
import { adaptTo } from "./adapt";
import { selectModel } from "./resolution";
import type { JsonConfig, ModelContext, ModelRegistry } from "./model-types";
import type { Resource } from "./types";

/** `java.beans.Introspector.decapitalize`: "Title" -> "title", "URL" -> "URL" (two capitals stay). */
export function decapitalize(name: string): string {
  if (name.length > 1 && name[0] === name[0].toUpperCase() && name[1] === name[1].toUpperCase()) return name;
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/** Own + inherited method names of an instance's prototype chain (stopping at Object.prototype). */
function methodNames(instance: object): string[] {
  const names = new Set<string>();
  for (let proto = Object.getPrototypeOf(instance) as object | null; proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto) as object | null) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name !== "constructor" && typeof (proto as Record<string, unknown>)[name] === "function") names.add(name);
    }
  }
  return [...names];
}

const isEmpty = (value: unknown) => value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

export function serialize(value: unknown, registry: ModelRegistry, path: object[] = []): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (path.includes(value)) throw new Error("Infinite recursion while serialising a model (a getter returns its own parent?)");
  const trail = [...path, value];
  if (Array.isArray(value)) return value.map((item) => serialize(item, registry, trail));
  if (value instanceof Map) return Object.fromEntries([...value].map(([k, v]) => [String(k), serialize(v, registry, trail)]));
  if (Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v !== "function").map(([k, v]) => [k, serialize(v, registry, trail)]));
  }

  const config: JsonConfig = registry.forInstance(value)?.json ?? {};
  const out: Record<string, unknown> = {};
  for (const method of methodNames(value)) {
    const match = /^(get|is)([A-Z].*)$/.exec(method);
    const getter = (value as Record<string, unknown>)[method] as () => unknown;
    if (!match || getter.length !== 0 || config.ignore?.includes(method)) continue;
    const result = getter.call(value);
    if (match[1] === "is" && typeof result !== "boolean") continue; // Jackson: isX() is a getter only if it returns boolean
    const serialized = serialize(result, registry, trail);
    const include = config.include ?? "always";
    if ((include === "non-null" && serialized === null) || (include === "non-empty" && isEmpty(serialized))) continue;
    out[config.rename?.[method] ?? decapitalize(match[2])] = serialized;
  }
  return out;
}

/**
 * `.model.json` of one resource: select -> adapt -> serialise; containers add `:items` / `:itemsOrder`.
 * `null` when no model exists or adaptation fails (such children are skipped by their container).
 */
export function exportResource(resource: Resource, registry: ModelRegistry, context: ModelContext): Record<string, unknown> | null {
  const def = selectModel(registry, resource);
  if (!def) return null;
  const model = adaptTo(resource, def, { ...context, registry });
  if (model === null) return null;
  const json = serialize(model, registry) as Record<string, unknown>;
  if (def.container) {
    const items: Record<string, unknown> = {};
    for (const child of resource.listChildren()) {
      const exported = exportResource(child, registry, context);
      if (exported !== null) items[child.getName()] = exported;
    }
    json[":items"] = items;
    json[":itemsOrder"] = Object.keys(items);
  }
  return json;
}
