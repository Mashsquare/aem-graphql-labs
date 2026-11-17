export function resolveProperty(target: unknown, name: string): unknown {
  if (target === null || target === undefined) return undefined;

  if (target instanceof Map) return target.get(name);
  if (Array.isArray(target)) return /^\d+$/.test(name) ? target[Number(name)] : undefined;
  if (typeof target !== "object") return undefined;
  if (Object.getPrototypeOf(target) === Object.prototype) return (target as Record<string, unknown>)[name];

  // A Java object: getX(), then isX() (booleans only), then a method named exactly like the property.
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  const object = target as Record<string, unknown>;
  const call = (method: string) => (typeof object[method] === "function" ? { value: (object[method] as () => unknown).call(target) } : null);

  const getter = call(`get${capitalized}`);
  if (getter) return getter.value;
  const isser = call(`is${capitalized}`);
  if (isser && typeof isser.value === "boolean") return isser.value;
  const exact = call(name);
  return exact ? exact.value : undefined;
}

export function toBoolean(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value);
  if (typeof value === "string") return value !== "" && value.toLowerCase() !== "false";
  if (Array.isArray(value)) return value.length > 0;
  if (value instanceof Map || value instanceof Set) return value.size > 0;
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) return Object.keys(value).length > 0;
  return true;
}
