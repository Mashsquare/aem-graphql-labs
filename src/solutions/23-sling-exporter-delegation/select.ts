import type { ModelDef, ModelRegistry, Resource } from "@/lib/sling";
import { relativeType, resourceTypeChain } from "@/lib/sling";

export function selectModel(registry: ModelRegistry, resource: Resource): ModelDef<unknown> | null {
  const searchPath = resource.getResourceResolver().getSearchPath();
  // Nearest type first: the project's own model beats the Core one it extends.
  for (const type of resourceTypeChain(resource)) {
    const match = registry.all().find((def) => def.resourceType !== undefined && relativeType(def.resourceType, searchPath) === type);
    if (match) return match;
  }
  return null;
}
