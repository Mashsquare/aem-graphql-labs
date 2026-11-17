import type { ValueType, ValueTypes } from "./types";

/**
 * `ValueMap.get(name, Type.class)` conversion — the lab's (deliberately simplified) rules:
 *
 *   missing / null                         -> null
 *   array -> scalar type                   -> the FIRST element (empty array -> null)
 *   scalar -> array type                   -> a one-element array
 *   string                                 <- anything, via String(x)
 *   long                                   <- number (truncated) | string of an integer ("1450", "-3"; NOT "12.5", NOT " 7")
 *   double                                 <- finite number | numeric string (surrounding whitespace allowed, "" is not a number)
 *   boolean                                <- boolean | ANY string: true only for "true" (any case) — "yes" and "1" are false, not null!
 *                                             numbers -> null
 *   date                                   <- ISO string | epoch millis; unparsable -> null
 *   X[]                                    <- each element converted; if ONE element fails the whole result is null
 */
export function coerce<K extends ValueType>(value: unknown, type: K): ValueTypes[K] | null {
  if (value === null || value === undefined) return null;

  if (type === "string[]" || type === "long[]") {
    const elementType = type === "string[]" ? "string" : "long";
    const out: unknown[] = [];
    for (const item of Array.isArray(value) ? value : [value]) {
      const converted = coerce(item, elementType);
      if (converted === null) return null;
      out.push(converted);
    }
    return out as ValueTypes[K];
  }

  const scalar = Array.isArray(value) ? value[0] : value;
  if (scalar === null || scalar === undefined) return null;

  switch (type) {
    case "string":
      return String(scalar) as ValueTypes[K];
    case "long":
      if (typeof scalar === "number") return (Number.isFinite(scalar) ? Math.trunc(scalar) : null) as ValueTypes[K] | null;
      if (typeof scalar === "string" && /^[+-]?\d+$/.test(scalar)) return Number(scalar) as ValueTypes[K];
      return null;
    case "double": {
      if (typeof scalar === "number") return (Number.isFinite(scalar) ? scalar : null) as ValueTypes[K] | null;
      if (typeof scalar === "string" && scalar.trim() !== "") {
        const parsed = Number(scalar);
        return (Number.isFinite(parsed) ? parsed : null) as ValueTypes[K] | null;
      }
      return null;
    }
    case "boolean":
      if (typeof scalar === "boolean") return scalar as ValueTypes[K];
      if (typeof scalar === "string") return (scalar.toLowerCase() === "true") as ValueTypes[K];
      return null;
    case "date": {
      if (typeof scalar !== "string" && typeof scalar !== "number") return null;
      const date = new Date(scalar);
      return (Number.isNaN(date.getTime()) ? null : date) as ValueTypes[K] | null;
    }
    default:
      return null;
  }
}
