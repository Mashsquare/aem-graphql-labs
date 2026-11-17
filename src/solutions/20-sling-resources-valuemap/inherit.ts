import type { Resource, ValueType, ValueTypes } from "@/lib/sling";

export function inheritedProperty<K extends ValueType>(page: Resource, name: string, type: K): { value: ValueTypes[K]; from: string } | null {
  for (let current: Resource | null = page; current; current = current.getParent()) {
    const value = current.getChild("jcr:content")?.getValueMap().get(name, type) ?? null;
    if (value !== null) return { value, from: current.getPath() };
  }
  return null;
}
