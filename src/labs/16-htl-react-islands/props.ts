import { todo } from "@/lib/todo";
import type { IslandElement } from "./types";

/**
 * Task 1a — turn ONE data attribute value (always a string) into the value the component wants.
 *
 *   ""            -> true        HTL renders `data-sale="${true}"` as a bare attribute: data-sale
 *   "true"/"false"-> boolean
 *   "1450", "-3.5"-> number      but NOT "007" or "1e3" (they stay strings: SKUs, ids)
 *   '["a","b"]'   -> parsed      anything starting with [ or { that is valid JSON; otherwise the string
 *   anything else -> the string unchanged
 */
export function coerceAttribute(value: string): unknown {
  void value;
  return todo("implement coerceAttribute in props.ts");
}

/**
 * Task 1b — read the props an HTL script handed to this element. Three conventions exist; support all:
 *
 *   data-props-id="x"   props are the JSON text of <script type="application/json" id="x"> (use readScript)
 *   data-props='{...}'  props are the JSON in the attribute
 *   data-foo-bar="1"    every other data-* attribute is a prop (dataset.fooBar), run through coerceAttribute
 *
 * Precedence: data-props-id, then data-props, then individual attributes.
 * The bookkeeping attributes are NOT props: reactComponent, reactMounted, props, propsId, cqDataPath.
 *
 * Throw `PropsError` (from ./types) — mentioning the component name — when the JSON is invalid, is not
 * an object (`null`, `[]`, `3`), or the script element does not exist.
 */
export function readProps(element: IslandElement, readScript: (id: string) => string | null): Record<string, unknown> {
  void element;
  void readScript;
  return todo("implement readProps in props.ts");
}
