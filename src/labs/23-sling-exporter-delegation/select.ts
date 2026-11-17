import type { ModelDef, ModelRegistry, Resource } from "@/lib/sling";
import { relativeType, resourceTypeChain } from "@/lib/sling";
import { todo } from "@/lib/todo";

/**
 * Task 2 — which model implements this component?
 *
 * Several models can be registered, each for one `resourceType`. For a resource, walk its type chain
 * (`resourceTypeChain(resource)`: nearest first, e.g. featured-teaser -> teaser -> Core teaser) and return the
 * model registered for the FIRST type that has one. `null` when none does.
 *
 * Compare types in relative form (`relativeType(type, searchPath)`), so a model registered for
 * "/apps/wknd/components/teaser" matches "wknd/components/teaser". Models without a `resourceType` never match.
 * This is how a proxy component with no model of its own inherits its parent's.
 */
export function selectModel(registry: ModelRegistry, resource: Resource): ModelDef<unknown> | null {
  void registry;
  void resource;
  void relativeType;
  void resourceTypeChain;
  return todo("implement selectModel");
}
