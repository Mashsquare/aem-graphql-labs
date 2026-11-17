import { coerce } from "./coerce";
import { getParentPath, normalizePath, resolvePath } from "./paths";
import type { JcrJson, JcrValue, Resource, ResourceResolver, ValueMap, ValueType } from "./types";

const isNode = (value: unknown): value is JcrJson => typeof value === "object" && value !== null && !Array.isArray(value);

export function createValueMap(properties: Record<string, unknown>): ValueMap {
  const map: ValueMap = {
    get: (name, type) => coerce(properties[name], type),
    getOr: <T extends string | number | boolean>(name: string, defaultValue: T): T => {
      const type: ValueType = typeof defaultValue === "string" ? "string" : typeof defaultValue === "number" ? "double" : "boolean";
      return (coerce(properties[name], type) ?? defaultValue) as T;
    },
    raw: (name) => properties[name],
    has: (name) => name in properties,
    keys: () => Object.keys(properties),
  };
  return map;
}

/** `/apps/wknd/components/teaser` and `wknd/components/teaser` are the same resource type. */
export function relativeType(resourceType: string, searchPath: string[]): string {
  for (const root of searchPath) {
    if (resourceType.startsWith(`${root}/`)) return resourceType.slice(root.length + 1);
  }
  return resourceType;
}

/**
 * Working reference implementation of the Sling `ResourceResolver` over a JSON tree.
 * Labs 20–23 build on it; Lab 20 has you re-implement its trickiest parts.
 */
export function createRepository(root: JcrJson, searchPath: string[] = ["/apps", "/libs"]): ResourceResolver {
  const nodeAt = (path: string): JcrJson | null => {
    let node: JcrJson = root;
    for (const segment of path.split("/").filter(Boolean)) {
      const next = node[segment];
      if (!isNode(next)) return null;
      node = next;
    }
    return node;
  };

  const resolver: ResourceResolver = {
    getSearchPath: () => searchPath,
    getResource(path) {
      const normal = normalizePath(path);
      if (normal === null) return null;
      const node = nodeAt(normal);
      return node ? makeResource(normal, node) : null;
    },
  };

  /** The component node (`/apps/wknd/components/teaser`) for a resource type, searching /apps then /libs. */
  const componentFor = (resourceType: string): JcrJson | null => {
    for (const prefix of resourceType.startsWith("/") ? [""] : searchPath) {
      const node = nodeAt(normalizePath(`${prefix}/${resourceType}`) ?? "/");
      if (node && node !== root) return node;
    }
    return null;
  };

  function makeResource(path: string, node: JcrJson): Resource {
    const properties = Object.fromEntries(Object.entries(node).filter(([, value]) => !isNode(value))) as Record<string, JcrValue>;
    const valueMap = createValueMap(properties);

    const self: Resource = {
      getPath: () => path,
      getName: () => path.slice(path.lastIndexOf("/") + 1),
      getParent() {
        const parent = getParentPath(path);
        return parent === null ? null : resolver.getResource(parent);
      },
      getChild(relativePath) {
        if (relativePath.startsWith("/")) return null;
        const target = resolvePath(path, relativePath);
        if (target === null || !(path === "/" || target.startsWith(`${path}/`))) return null;
        return resolver.getResource(target);
      },
      listChildren: () => Object.entries(node).filter(([, value]) => isNode(value)).map(([name]) => makeResource(path === "/" ? `/${name}` : `${path}/${name}`, node[name] as JcrJson)),
      getResourceType() {
        const own = properties["sling:resourceType"] ?? properties["jcr:primaryType"];
        return typeof own === "string" ? own : "nt:unstructured";
      },
      getResourceSuperType() {
        const own = properties["sling:resourceSuperType"];
        if (typeof own === "string") return own;
        const inherited = componentFor(self.getResourceType())?.["sling:resourceSuperType"];
        return typeof inherited === "string" ? relativeType(inherited, searchPath) : null;
      },
      isResourceType(resourceType) {
        const wanted = relativeType(resourceType, searchPath);
        const seen = new Set<string>();
        let current: string | null = relativeType(self.getResourceType(), searchPath);
        let first = true;
        while (current !== null && !seen.has(current)) {
          if (current === wanted) return true;
          seen.add(current);
          // Same rule as getResourceSuperType: the resource's own override applies to the first hop only.
          const component: JcrJson | null = componentFor(current);
          const own: JcrValue | JcrJson | undefined = first ? properties["sling:resourceSuperType"] : undefined;
          const up: JcrValue | JcrJson | undefined = typeof own === "string" ? own : component?.["sling:resourceSuperType"];
          current = typeof up === "string" ? relativeType(up, searchPath) : null;
          first = false;
        }
        return false;
      },
      getValueMap: () => valueMap,
      getResourceResolver: () => resolver,
    };
    return self;
  }

  return resolver;
}

/** `[type, supertype, super-supertype, …]` for a resource, nearest first (relative form). */
export function resourceTypeChain(resource: Resource): string[] {
  const resolver = resource.getResourceResolver();
  const searchPath = resolver.getSearchPath();
  const chain: string[] = [];
  let type: string | null = relativeType(resource.getResourceType(), searchPath);
  let up: string | null = resource.getResourceSuperType(); // the resource's own override applies to the first hop only
  while (type !== null && !chain.includes(type)) {
    chain.push(type);
    type = up === null ? null : relativeType(up, searchPath);
    up = type === null ? null : superTypeOfComponent(resolver, type);
  }
  return chain;
}

/** `sling:resourceSuperType` declared by the component node of `resourceType` (searching /apps, /libs). */
export function superTypeOfComponent(resolver: ResourceResolver, resourceType: string): string | null {
  for (const prefix of resourceType.startsWith("/") ? [""] : resolver.getSearchPath()) {
    const component = resolver.getResource(`${prefix}/${resourceType}`);
    if (component) {
      const up = component.getValueMap().get("sling:resourceSuperType", "string");
      return up === null ? null : relativeType(up, resolver.getSearchPath());
    }
  }
  return null;
}
