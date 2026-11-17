import type { ModelRegistry } from "@/lib/sling";
import { todo } from "@/lib/todo";

/**
 * Task 1 — the Jackson exporter.
 *
 * `serialize(value, registry)` turns a model into plain JSON-ready data, the way
 * `@Exporter(name = "jackson", extensions = "json")` does. Rules:
 *
 *  Values
 *   - `null` / `undefined` -> `null`; strings, numbers, booleans as they are
 *   - `Date` -> ISO string (`toISOString()`)
 *   - arrays -> serialise each element;  `Map` -> an object with the serialised values
 *   - plain objects (`{…}`, a Java Map) -> serialise each own value; skip values that are functions
 *
 *  Model instances (anything else with a prototype) — only GETTERS count, fields are private:
 *   - a getter is a method named `getXxx` or `isXxx` (the letter after the prefix is UPPER-case), taking no parameters
 *     (`fn.length === 0`). `isXxx` counts only when it RETURNS a boolean.
 *   - include inherited methods (walk the prototype chain, stop before Object.prototype)
 *   - property name: `decapitalize(rest)` (exported from "@/lib/sling"): "Title" -> "title", but "URL" stays "URL"
 *   - the model's `json` config comes from `registry.forInstance(value)?.json` and is keyed by METHOD name:
 *       rename: { getExportedType: ":type" }   -> use that key instead
 *       ignore: ["getResource"]                -> skip that getter (never call it)
 *       include: "always" (default) | "non-null" (omit null) | "non-empty" (omit null, "" and [])
 *   - a value that contains itself (a getter handing back its parent) must throw instead of looping forever:
 *     `new Error("Infinite recursion …")`
 */
export function serialize(value: unknown, registry: ModelRegistry): unknown {
  void value;
  void registry;
  return todo("implement serialize");
}
