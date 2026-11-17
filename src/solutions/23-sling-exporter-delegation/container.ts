import type { ModelContext, ModelRegistry, Resource } from "@/lib/sling";
import { adaptTo } from "@/lib/sling";
import { selectModel } from "./select";
import { serialize } from "./serialize";

export function exportResource(resource: Resource, registry: ModelRegistry, context: ModelContext): Record<string, unknown> | null {
  const def = selectModel(registry, resource);
  if (!def) return null;

  const model = adaptTo(resource, def, { ...context, registry });
  if (model === null) return null;

  const json = serialize(model, registry) as Record<string, unknown>;
  if (def.container) {
    const items: Record<string, unknown> = {};
    for (const child of resource.listChildren()) {
      const exported = exportResource(child, registry, context);
      if (exported !== null) items[child.getName()] = exported; // a child without a (working) model simply is not exported
    }
    json[":items"] = items;
    json[":itemsOrder"] = Object.keys(items);
  }
  return json;
}
