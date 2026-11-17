import { decapitalize, type JsonConfig, type ModelRegistry } from "@/lib/sling";

/** Own and inherited method names of an instance, stopping before Object.prototype. */
function methodNames(instance: object): string[] {
  const names = new Set<string>();
  for (let proto = Object.getPrototypeOf(instance) as object | null; proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto) as object | null) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name !== "constructor" && typeof (proto as Record<string, unknown>)[name] === "function") names.add(name);
    }
  }
  return [...names];
}

const isEmpty = (value: unknown) => value === null || value === "" || (Array.isArray(value) && value.length === 0);

export function serialize(value: unknown, registry: ModelRegistry, ancestors: object[] = []): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();

  if (ancestors.includes(value)) throw new Error("Infinite recursion while serialising: a getter returns an object that contains itself");
  const trail = [...ancestors, value];

  if (Array.isArray(value)) return value.map((item) => serialize(item, registry, trail));
  if (value instanceof Map) return Object.fromEntries([...value].map(([key, item]) => [String(key), serialize(item, registry, trail)]));
  if (Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => typeof item !== "function")
        .map(([key, item]) => [key, serialize(item, registry, trail)]),
    );
  }

  // A model: serialise its getters.
  const config: JsonConfig = registry.forInstance(value)?.json ?? {};
  const include = config.include ?? "always";
  const out: Record<string, unknown> = {};

  for (const method of methodNames(value)) {
    const match = /^(get|is)([A-Z].*)$/.exec(method);
    const getter = (value as Record<string, unknown>)[method] as () => unknown;
    if (!match || getter.length !== 0) continue;
    if (config.ignore?.includes(method)) continue; // never even call an ignored getter

    const result = getter.call(value);
    if (match[1] === "is" && typeof result !== "boolean") continue;

    const json = serialize(result, registry, trail);
    if (include === "non-null" && json === null) continue;
    if (include === "non-empty" && isEmpty(json)) continue;
    out[config.rename?.[method] ?? decapitalize(match[2])] = json;
  }
  return out;
}
