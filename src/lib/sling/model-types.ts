/**
 * How a Sling Model is *declared* in these labs.
 *
 * In Java the declaration is annotations on a class. TypeScript has no runtime-visible annotations
 * on fields (and no reflection on types), so the same information is written as data next to the class:
 *
 *   @Model(adaptables = Resource.class, resourceType = "wknd/components/pricetag",      defineModel({ name: "PriceTag", type: PriceTag,
 *          defaultInjectionStrategy = OPTIONAL)                                            adaptables: ["resource"], resourceType: "…",
 *   public class PriceTag {                                                                defaultInjectionStrategy: "optional",
 *     @ValueMapValue @Default(values = "USD") private String currency;                    fields: { currency: valueMap("string", { default: "USD" }) },
 *     @PostConstruct protected void init() { … }                                           postConstruct: ["init"] })
 *   }
 */
import type { Adaptable, Resource, ValueType } from "./types";

export type AdaptableKind = "resource" | "request";

interface Common {
  /** `@Named("jcr:title")` — the name to look up when it differs from the field name. */
  named?: string;
  /** `@Via("jcr:content", type = ChildResource.class)` — read from this child of the adaptable's resource instead. */
  via?: string;
  /** `@Default(values = …)` — used when nothing was found. */
  default?: unknown;
  /** `true` = `@Optional`, `false` = `@Required`, absent = the model's `defaultInjectionStrategy`. */
  optional?: boolean;
}

/** `@ValueMapValue` — a property of the resource, converted to the field's type. */
export interface ValueMapSpec extends Common {
  source: "valueMap";
  type: ValueType;
}
/** `@ChildResource` — a child node: as Resource, adapted to a model, or (lists) all of ITS children. */
export interface ChildSpec extends Common {
  source: "child";
  /** resource: Resource · model: adapted · resources: List<Resource> of the named child's children · models: List<Model> */
  as?: "resource" | "model" | "resources" | "models";
  model?: ModelDef<unknown>;
}
/**
 * `@Self` — the adaptable itself (or adapted to another model). `viaSuperType` = `@Via(type = ResourceSuperType.class)`:
 * adapt the same resource *as if it were its super type*; without `model`, the registry picks the model for that type.
 */
export interface SelfSpec extends Common {
  source: "self";
  model?: ModelDef<unknown>;
  viaSuperType?: boolean;
}
/** `@OSGiService` — a service from the registry. */
export interface ServiceSpec extends Common {
  source: "osgi";
  service: string;
}
/** `@ScriptVariable` — a script binding (`currentPage`, `properties` …). Requires a request adaptable. */
export interface ScriptSpec extends Common {
  source: "script";
}
/** `@RequestAttribute` — requires a request adaptable. */
export interface RequestAttributeSpec extends Common {
  source: "requestAttribute";
}

export type FieldSpec = ValueMapSpec | ChildSpec | SelfSpec | ServiceSpec | ScriptSpec | RequestAttributeSpec;

type Opts<S extends FieldSpec> = Omit<S, "source" | "type" | "service">;
export const valueMap = (type: ValueType, options: Opts<ValueMapSpec> = {}): ValueMapSpec => ({ source: "valueMap", type, ...options });
export const child = (options: Opts<ChildSpec> = {}): ChildSpec => ({ source: "child", ...options });
export const self = (options: Opts<SelfSpec> = {}): SelfSpec => ({ source: "self", ...options });
export const osgiService = (service: string, options: Opts<ServiceSpec> = {}): ServiceSpec => ({ source: "osgi", service, ...options });
export const scriptVariable = (options: Opts<ScriptSpec> = {}): ScriptSpec => ({ source: "script", ...options });
export const requestAttribute = (options: Opts<RequestAttributeSpec> = {}): RequestAttributeSpec => ({ source: "requestAttribute", ...options });

/** Jackson annotations, keyed by getter *method name* (`getText`). */
export interface JsonConfig {
  /** `@JsonProperty(":type")` on a getter */
  rename?: Record<string, string>;
  /** `@JsonIgnore` on a getter */
  ignore?: string[];
  /** `@JsonInclude(…)` on the class. Jackson's default is "always". */
  include?: "always" | "non-null" | "non-empty";
}

export interface ModelDef<T = unknown> {
  name: string;
  type: new () => T;
  adaptables: AdaptableKind[];
  /** `@Model(resourceType = …)` — which components this model implements (used by the exporter / ModelFactory). */
  resourceType?: string;
  /** `@Model(defaultInjectionStrategy = …)`; Sling's default is REQUIRED. */
  defaultInjectionStrategy?: "required" | "optional";
  /** field name -> how to inject it. */
  fields: Record<string, FieldSpec>;
  /** Method names run (in order) after injection: `@PostConstruct`. */
  postConstruct?: string[];
  /** `@Exporter(name = "jackson", extensions = "json")` configuration. */
  json?: JsonConfig;
  /** Implements `ContainerExporter`: the export gets `:items` / `:itemsOrder` from the resource's children. */
  container?: boolean;
}

export function defineModel<T>(def: ModelDef<T>): ModelDef<T> {
  return def;
}

/** Everything `adaptTo` needs besides the adaptable: the OSGi service registry and (Lab 23) the model registry. */
export interface ModelContext {
  services: Record<string, unknown>;
  registry?: ModelRegistry;
  /** Lab 23 plugs in its own implementations here; the reference engine falls back to the lib's. */
  hooks?: {
    wrapAsSuperType?: (resource: Resource) => Resource | null;
    selectModel?: (registry: ModelRegistry, resource: Resource) => ModelDef<unknown> | null;
  };
}

export type InjectResult = { found: true; value: unknown } | { found: false };

/** What an injector gets: the field it fills, and everything it may read. */
export interface InjectionContext {
  /** The thing `adaptTo` was called on. */
  adaptable: Adaptable;
  /** The resource the adaptable stands for (the request's resource for requests). */
  resource: Resource;
  context: ModelContext;
  /** Adapt something else to a model (nested models, `@Self`, `@ChildResource`). Returns `null` on failure. */
  adapt: (adaptable: Adaptable, model: ModelDef<unknown>) => unknown;
}

export class ModelRegistry {
  private readonly defs: ModelDef<unknown>[] = [];

  constructor(defs: ModelDef<unknown>[] = []) {
    defs.forEach((def) => this.register(def));
  }

  register(def: ModelDef<unknown>): this {
    this.defs.push(def);
    return this;
  }

  all(): readonly ModelDef<unknown>[] {
    return this.defs;
  }

  /** The definition whose class created `instance` (how Jackson would find the annotations). */
  forInstance(instance: object): ModelDef<unknown> | undefined {
    return this.defs.find((def) => instance instanceof def.type);
  }
}
