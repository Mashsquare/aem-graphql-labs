import type { ModelNode } from "@/lib/aem/page-model";

export function childrenOf(model: ModelNode): { key: string; model: ModelNode }[] {
  const items = model[":items"];
  if (!items) return [];
  const order = model[":itemsOrder"] ?? Object.keys(items);
  // hasOwn: an order list from content must not reach "constructor" or "__proto__".
  return order.flatMap((key) => (Object.hasOwn(items, key) ? [{ key, model: items[key] }] : []));
}

export function findByPath(root: ModelNode, cqPath: string): ModelNode | undefined {
  if (root[":path"] === cqPath) return root;
  for (const child of Object.values(root[":items"] ?? {})) {
    const found = findByPath(child, cqPath);
    if (found) return found;
  }
  return undefined;
}

export function applyUpdate(root: ModelNode, cqPath: string, replacement: ModelNode): ModelNode {
  if (root[":path"] === cqPath) return replacement;
  const items = root[":items"];
  if (!items) return root;
  for (const [key, child] of Object.entries(items)) {
    const updated = applyUpdate(child, cqPath, replacement);
    if (updated !== child) return { ...root, ":items": { ...items, [key]: updated } }; // copy the ancestors only
  }
  return root;
}
