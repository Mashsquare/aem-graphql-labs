import type { ValueType, ValueTypes } from "@/lib/sling";

export function coerce<K extends ValueType>(value: unknown, type: K): ValueTypes[K] | null {
  if (value === null || value === undefined) return null;

  // Array targets: convert element by element; one failure fails the whole conversion.
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

  // Scalar targets: a multi-value property yields its first element.
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
