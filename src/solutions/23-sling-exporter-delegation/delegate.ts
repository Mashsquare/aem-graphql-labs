import type { Resource } from "@/lib/sling";
import { resourceTypeChain } from "@/lib/sling";

export function wrapAsSuperType(resource: Resource): Resource | null {
  const superType = resource.getResourceSuperType();
  if (superType === null) return null;
  const chain = resourceTypeChain(resource);

  return new Proxy(resource, {
    get(target, property) {
      if (property === "getResourceType") return () => superType;
      if (property === "getResourceSuperType") return () => chain[2] ?? null;
      const value = Reflect.get(target, property) as unknown;
      // Bind: methods of the original must run against the original, not the proxy.
      return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(target) : value;
    },
  });
}
