import type { ModelContext, ModelRegistry, Resource } from "@/lib/sling";
import { adaptTo } from "@/lib/sling";
import { todo } from "@/lib/todo";
import { selectModel } from "./select";
import { serialize } from "./serialize";

/**
 * Task 4 — `.model.json` of a resource (and its whole subtree).
 *
 *  1. `selectModel(registry, resource)` — no model: return null
 *  2. adapt: `adaptTo(resource, def, { ...context, registry })` (the registry in the context lets `@Via(ResourceSuperType)` work).
 *     Adaptation failed: return null
 *  3. `serialize(model, registry)` -> the JSON object
 *  4. If `def.container` (the model implements ContainerExporter): add
 *       ":items"       { childName: exportedChild } for every child that exports to something (children that return null are SKIPPED)
 *       ":itemsOrder"  the names in the children's order — exactly the keys of ":items"
 *
 * Mirrors what `/content/wknd/us/en.model.json` returns in Labs 17 and 18.
 */
export function exportResource(resource: Resource, registry: ModelRegistry, context: ModelContext): Record<string, unknown> | null {
  void resource;
  void registry;
  void context;
  void adaptTo;
  void selectModel;
  void serialize;
  return todo("implement exportResource");
}
