import type { Resource } from "@/lib/sling";
import { resourceTypeChain } from "@/lib/sling";
import { todo } from "@/lib/todo";

/**
 * Task 3 — `@Via(type = ResourceSuperType.class)`.
 *
 * Return a view of `resource` that claims to be of its SUPER type:
 *   - `getResourceType()`       the original's super type (`resource.getResourceSuperType()`)
 *   - `getResourceSuperType()`  the next one up (the 3rd entry of `resourceTypeChain(resource)`), or null
 *   - EVERYTHING else behaves exactly like the original: same path, same properties, same children, same parent
 *   - `null` when the resource has no super type
 * The original must not change.
 *
 * Why: the project model wants "the Core model for THIS resource". `selectModel(registry, wrapped)` then finds the Core
 * model, and `adaptTo(wrapped, coreModel)` fills it from the same content.
 * Hint: a `Proxy` whose `get` trap answers two methods and forwards (and BINDS) the rest.
 */
export function wrapAsSuperType(resource: Resource): Resource | null {
  void resource;
  void resourceTypeChain;
  return todo("implement wrapAsSuperType");
}
