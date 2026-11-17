import { relativeType, resourceTypeChain } from "./repository";
import type { ModelDef, ModelRegistry } from "./model-types";
import type { Resource } from "./types";

/** The model registered for the nearest type in the resource's super type chain, or `null`. */
export function selectModel(registry: ModelRegistry, resource: Resource): ModelDef<unknown> | null {
  const searchPath = resource.getResourceResolver().getSearchPath();
  for (const type of resourceTypeChain(resource)) {
    const def = registry.all().find((candidate) => candidate.resourceType && relativeType(candidate.resourceType, searchPath) === type);
    if (def) return def;
  }
  return null;
}

/** `ResourceSuperTypeWrapper`: the same resource, but it claims to be of its super type. `null` without a super type. */
export function wrapAsSuperType(resource: Resource): Resource | null {
  const superType = resource.getResourceSuperType();
  if (superType === null) return null;
  const chain = resourceTypeChain(resource);
  return new Proxy(resource, {
    get(target, property) {
      if (property === "getResourceType") return () => superType;
      if (property === "getResourceSuperType") return () => chain[2] ?? null;
      const value = Reflect.get(target, property) as unknown;
      return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(target) : value;
    },
  });
}
