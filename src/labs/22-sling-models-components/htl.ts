import { todo } from "@/lib/todo";

/**
 * Task 1 — how HTL reads a model.
 *
 * `${model.sale}` in a template does NOT read a field. HTL looks for a *method* on the Java object.
 * For `resolveProperty(target, "sale")` try, in this order, and return the first hit:
 *
 *   1. getSale()        (the name with its first letter upper-cased, prefixed with "get")
 *   2. isSale()         — counts only when it returns a boolean
 *   3. sale()           (a method with exactly that name — which is why `${model.isSale}` ALSO works)
 *
 * Methods are called with no arguments. Fields are never read (a Java `private String title;` without a getter is
 * invisible to HTL, and the lab treats TypeScript fields the same way).
 *
 * Other targets: a plain object `{...}` is a Java `Map` -> the key; a `Map` -> `.get(name)`;
 * an array -> numeric index (`"0"`, `"1"`); `null`/`undefined` -> `undefined` (HTL never throws on null).
 * Nothing found -> `undefined`.
 */
export function resolveProperty(target: unknown, name: string): unknown {
  void target;
  void name;
  return todo("implement resolveProperty");
}

/**
 * HTL's boolean cast — what `data-sly-test="${…}"` and `${a ? b : c}` apply to any value:
 *
 *   null / undefined                 false
 *   boolean                          itself
 *   number                           false for 0 and NaN, else true
 *   string                           false for "" and for "false" (any case), else true  — so "0" and "no" are TRUE
 *   array, Map, Set                  true only when not empty
 *   plain object ({…}, a Java Map)   true only when it has at least one key
 *   anything else (a model, a Date)  true
 */
export function toBoolean(value: unknown): boolean {
  void value;
  return todo("implement toBoolean");
}
