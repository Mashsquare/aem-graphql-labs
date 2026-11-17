import type { Resource, ValueType, ValueTypes } from "@/lib/sling";
import { todo } from "@/lib/todo";

/**
 * Task 4 — inherited page properties (`HierarchyNodeInheritanceValueMap`).
 *
 * Footers, logos and "show search" switches are authored once at the site root and inherited by every page below.
 * Starting at `page` itself, look at `<page>/jcr:content`'s ValueMap; if it has no usable value (null after
 * conversion) go to the parent page and try again, all the way to the root.
 *
 * Return the value and the path of the page it came from, or `null` when no ancestor has it.
 */
export function inheritedProperty<K extends ValueType>(page: Resource, name: string, type: K): { value: ValueTypes[K]; from: string } | null {
  void page;
  void name;
  void type;
  return todo("implement inheritedProperty");
}
