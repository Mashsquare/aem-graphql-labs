import type { Resource, ResourceResolver } from "@/lib/sling";
import { relativeType } from "@/lib/sling";
import { todo } from "@/lib/todo";

/**
 * Task 3 — resource types and the super type chain.
 *
 * A component is a node at `/apps/<resourceType>` (or `/libs/<resourceType>`; the resolver's search path
 * says where to look and in which order). It may declare `sling:resourceSuperType` — the component it extends.
 *
 *   wknd/components/featured-teaser  ->  wknd/components/teaser  ->  core/wcm/components/teaser/v2/teaser
 *
 * `relativeType(type, searchPath)` (provided) turns "/apps/wknd/components/teaser" into "wknd/components/teaser".
 */

/**
 * The super type declared by the component of `resourceType`, in relative form, or `null`.
 * Look the component up under every search-path root in order (`/apps`, then `/libs`); an absolute
 * resource type (`/apps/wknd/…`) is used as it is. The first component node you find decides.
 */
export function superTypeOf(resolver: ResourceResolver, resourceType: string): string | null {
  void resolver;
  void resourceType;
  void relativeType;
  return todo("implement superTypeOf");
}

/**
 * `[ownType, superType, superSuperType, …]` for a resource, nearest first, all in relative form.
 *   - The resource's own `sling:resourceSuperType` property (`resource.getResourceSuperType()`) overrides what its
 *     component declares — but only for the first hop.
 *   - Stop at the end of the chain AND when a type repeats (a broken project can have A -> B -> A).
 */
export function typeChain(resolver: ResourceResolver, resource: Resource): string[] {
  void resolver;
  void resource;
  return todo("implement typeChain");
}

/** `resource.isResourceType(type)`: true when `type` (either spelling) appears in the chain. */
export function isResourceType(resolver: ResourceResolver, resource: Resource, resourceType: string): boolean {
  void resolver;
  void resource;
  void resourceType;
  return todo("implement isResourceType");
}
