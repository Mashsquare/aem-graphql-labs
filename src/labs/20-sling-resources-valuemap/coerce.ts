import type { ValueType, ValueTypes } from "@/lib/sling";
import { todo } from "@/lib/todo";

/**
 * Task 1 — `ValueMap.get(name, Type.class)`.
 *
 * Convert a raw JCR property value to the requested type. Return `null` when the value is missing
 * or cannot be converted (Java: `null`, never an exception). The rules, in the order to implement them:
 *
 *   missing / null / undefined       -> null
 *   X[] target ("string[]","long[]") -> convert every element; a scalar becomes a one-element array;
 *                                       if ONE element cannot be converted the whole result is null
 *   scalar target, array value       -> use the FIRST element (empty array -> null)
 *   "string"   <- anything: String(value)
 *   "long"     <- number: truncate toward zero (12.9 -> 12, -3.9 -> -3), NaN/Infinity -> null
 *                 string: only integer text matches "1450", "-3", "+7"; "12.5", " 7" and "abc" -> null
 *                 boolean -> null
 *   "double"   <- finite number | numeric string (surrounding whitespace is fine, "" is not a number) | else null
 *   "boolean"  <- boolean | ANY string: true only if it equals "true" ignoring case. "yes" and "1" give false (not null!)
 *                 number -> null
 *   "date"     <- ISO string or epoch milliseconds; anything that does not parse -> null
 */
export function coerce<K extends ValueType>(value: unknown, type: K): ValueTypes[K] | null {
  void value;
  void type;
  return todo("implement coerce(value, type) following the rules above");
}
