import { todo } from "@/lib/todo";
import type { Mapping } from "./types";

/**
 * Task 1 — a registry that maps AEM resource types to React components.
 *
 *   const mapping = createMapping();
 *   export default mapping.MapTo("wknd/components/title")(Title, { emptyLabel: "Title", isEmpty: p => !p.text });
 *
 * - `MapTo(types)` takes one type or an array and returns a function `(Component, editConfig?)` that registers the
 *   component for every type and returns the SAME component (so it can be exported directly).
 * - `get(type)` returns `{ Component, editConfig }` or undefined.
 * - AEM spells the same component's type differently depending on where you read it: "wknd/components/title" in
 *   the page model, "/apps/wknd/components/title" in other places. `get` must treat a leading "/apps/" or "/libs/"
 *   as optional — whichever form you registered.
 * - Registering a type again replaces the earlier registration (hot reload!).
 * - No module-level state: two calls to createMapping() are two independent registries.
 */
export function createMapping(): Mapping {
  return todo("implement createMapping in mapping.ts");
}
