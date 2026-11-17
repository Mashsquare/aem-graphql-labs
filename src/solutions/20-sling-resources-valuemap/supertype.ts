import type { Resource, ResourceResolver } from "@/lib/sling";
import { relativeType } from "@/lib/sling";

export function superTypeOf(resolver: ResourceResolver, resourceType: string): string | null {
  const roots = resourceType.startsWith("/") ? [""] : resolver.getSearchPath();
  for (const root of roots) {
    const component = resolver.getResource(`${root}/${resourceType}`);
    if (component) {
      // The first component found wins, even if it declares no super type (/apps shadows /libs).
      const declared = component.getValueMap().get("sling:resourceSuperType", "string");
      return declared === null ? null : relativeType(declared, resolver.getSearchPath());
    }
  }
  return null;
}

export function typeChain(resolver: ResourceResolver, resource: Resource): string[] {
  const searchPath = resolver.getSearchPath();
  const chain: string[] = [];
  let type: string | null = relativeType(resource.getResourceType(), searchPath);
  // The resource's own override (getResourceSuperType) decides the first hop only.
  let next: string | null = resource.getResourceSuperType();
  while (type !== null && !chain.includes(type)) {
    chain.push(type);
    type = next === null ? null : relativeType(next, searchPath);
    next = type === null ? null : superTypeOf(resolver, type);
  }
  return chain;
}

export function isResourceType(resolver: ResourceResolver, resource: Resource, resourceType: string): boolean {
  return typeChain(resolver, resource).includes(relativeType(resourceType, resolver.getSearchPath()));
}
