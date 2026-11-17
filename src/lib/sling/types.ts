/**
 * A tiny model of the Apache Sling API, just big enough to teach Sling Models.
 *
 *   JCR node tree  ->  Resource  ->  ValueMap          (Lab 20)
 *   Resource       ->  adaptTo(Model)                  (Labs 21, 22)
 *   Model          ->  JSON via the Exporter           (Lab 23)
 *
 * The names mirror the Java API (`getChild`, `getValueMap`, `listChildren`, `isResourceType` …) on
 * purpose, so the code you read in these labs maps one-to-one onto real AEM code.
 */

export type JcrScalar = string | number | boolean;
/** A JCR property: a scalar or a multi-value (array of scalars). */
export type JcrValue = JcrScalar | JcrScalar[];
/**
 * The repository as Sling's JSON view (`/content/x.infinity.json`, CRXDE) shows it:
 * an object is a node, everything else is a property.
 */
export interface JcrJson {
  [key: string]: JcrValue | JcrJson;
}

/** The types `ValueMap.get(name, Type.class)` can convert to. */
export interface ValueTypes {
  string: string;
  long: number;
  double: number;
  boolean: boolean;
  date: Date;
  "string[]": string[];
  "long[]": number[];
}
export type ValueType = keyof ValueTypes;

export interface ValueMap {
  /** `valueMap.get("amount", Double.class)` -> converted value, or `null` when missing / not convertible. */
  get<K extends ValueType>(name: string, type: K): ValueTypes[K] | null;
  /** `valueMap.get("currency", "USD")` -> the type comes from the default; the default is returned when missing / not convertible. */
  getOr<T extends string | number | boolean>(name: string, defaultValue: T): T;
  /** `valueMap.get("amount")` on the underlying `Map<String, Object>`: the raw stored value, unconverted. */
  raw(name: string): unknown;
  has(name: string): boolean;
  keys(): string[];
}

export interface Resource {
  /** `/content/wknd/us/en/jcr:content/root/hero` */
  getPath(): string;
  /** last path segment (`hero`); `""` for the root */
  getName(): string;
  getParent(): Resource | null;
  /** child by *relative* path (`"image"`, `"actions/item0"`); `null` when absent */
  getChild(relativePath: string): Resource | null;
  listChildren(): Resource[];
  /** `sling:resourceType`, falling back to `jcr:primaryType`, then `nt:unstructured` */
  getResourceType(): string;
  /** the resource's own `sling:resourceSuperType`, else the one its component declares */
  getResourceSuperType(): string | null;
  /** true for the resource type itself and every type in its super type chain */
  isResourceType(resourceType: string): boolean;
  getValueMap(): ValueMap;
  getResourceResolver(): ResourceResolver;
}

export interface ResourceResolver {
  /** Absolute path -> resource, or `null`. */
  getResource(path: string): Resource | null;
  /** Where relative resource types are looked up. In AEM: `/apps` first, then `/libs`. */
  getSearchPath(): string[];
}

/** Stand-in for `SlingHttpServletRequest`: what a model sees when it is adapted from a request. */
export interface SlingRequest {
  kind: "request";
  /** `request.getResource()` — the resource the URL resolved to */
  resource: Resource;
  /** `request.setAttribute(…)` / `request.getAttribute(…)` */
  attributes: Record<string, unknown>;
  /** The HTL/JSP script bindings: `currentPage`, `properties`, `component` … */
  bindings: Record<string, unknown>;
}

export type Adaptable = Resource | SlingRequest;
export const isRequest = (adaptable: Adaptable): adaptable is SlingRequest => "kind" in adaptable && adaptable.kind === "request";
