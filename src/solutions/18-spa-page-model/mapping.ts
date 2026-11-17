import type { MappedComponent, Mapping } from "@/labs/18-spa-page-model/types";

// "/apps/wknd/components/title" and "wknd/components/title" are the same component.
const normalize = (resourceType: string) => resourceType.replace(/^\/(?:apps|libs)\//, "");

export function createMapping(): Mapping {
  const registry = new Map<string, MappedComponent>();
  return {
    MapTo(resourceTypes) {
      const types = Array.isArray(resourceTypes) ? resourceTypes : [resourceTypes];
      return (Component, editConfig) => {
        for (const type of types) registry.set(normalize(type), { Component, editConfig });
        return Component;
      };
    },
    get: (resourceType) => registry.get(normalize(resourceType)),
  };
}
