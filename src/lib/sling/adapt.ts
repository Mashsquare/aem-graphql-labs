/**
 * Reference implementation of `adaptTo`, used by Labs 22 and 23 (and the lib's own tests).
 * Lab 21 has you write the same thing yourself.
 */
import { selectModel, wrapAsSuperType } from "./resolution";
import { isRequest } from "./types";
import type { Adaptable, Resource } from "./types";
import type { FieldSpec, InjectionContext, InjectResult, ModelContext, ModelDef } from "./model-types";

const NOT_FOUND: InjectResult = { found: false };
const found = (value: unknown): InjectResult => ({ found: true, value });

export function baseResource(spec: FieldSpec, ctx: InjectionContext): Resource | null {
  return spec.via ? ctx.resource.getChild(spec.via) : ctx.resource;
}

type Injector = (spec: FieldSpec, fieldName: string, ctx: InjectionContext) => InjectResult;

const injectors: Record<FieldSpec["source"], Injector> = {
  valueMap(spec, fieldName, ctx) {
    if (spec.source !== "valueMap") return NOT_FOUND;
    const base = baseResource(spec, ctx);
    const value = base?.getValueMap().get(spec.named ?? fieldName, spec.type) ?? null;
    return value === null ? NOT_FOUND : found(value);
  },
  child(spec, fieldName, ctx) {
    if (spec.source !== "child") return NOT_FOUND;
    const target = baseResource(spec, ctx)?.getChild(spec.named ?? fieldName);
    if (!target) return NOT_FOUND;
    const as = spec.as ?? (spec.model ? "model" : "resource");
    const adaptAll = (resources: Resource[]) => resources.map((r) => (spec.model ? ctx.adapt(r, spec.model) : r)).filter((m) => m !== null);
    if (as === "resource") return found(target);
    if (as === "resources") return found(target.listChildren());
    if (as === "models") return found(adaptAll(target.listChildren()));
    const adapted = spec.model ? ctx.adapt(target, spec.model) : null;
    return adapted === null ? NOT_FOUND : found(adapted);
  },
  self(spec, _fieldName, ctx) {
    if (spec.source !== "self") return NOT_FOUND;
    if (spec.viaSuperType) {
      const wrapped = (ctx.context.hooks?.wrapAsSuperType ?? wrapAsSuperType)(ctx.resource);
      if (!wrapped) return NOT_FOUND;
      const registry = ctx.context.registry;
      const def = spec.model ?? (registry ? (ctx.context.hooks?.selectModel ?? selectModel)(registry, wrapped) : null);
      if (!def) return NOT_FOUND;
      const adapted = ctx.adapt(wrapped, def);
      return adapted === null ? NOT_FOUND : found(adapted);
    }
    if (!spec.model) return found(ctx.adaptable);
    const adapted = ctx.adapt(ctx.adaptable, spec.model);
    return adapted === null ? NOT_FOUND : found(adapted);
  },
  osgi(spec, _fieldName, ctx) {
    if (spec.source !== "osgi") return NOT_FOUND;
    return spec.service in ctx.context.services ? found(ctx.context.services[spec.service]) : NOT_FOUND;
  },
  script(spec, fieldName, ctx) {
    if (spec.source !== "script" || !isRequest(ctx.adaptable)) return NOT_FOUND;
    const name = spec.named ?? fieldName;
    return name in ctx.adaptable.bindings ? found(ctx.adaptable.bindings[name]) : NOT_FOUND;
  },
  requestAttribute(spec, fieldName, ctx) {
    if (spec.source !== "requestAttribute" || !isRequest(ctx.adaptable)) return NOT_FOUND;
    const name = spec.named ?? fieldName;
    return name in ctx.adaptable.attributes ? found(ctx.adaptable.attributes[name]) : NOT_FOUND;
  },
};

/** `adaptable.adaptTo(Model.class)`: a new instance, or `null` when anything required is missing. */
export function adaptTo<T>(adaptable: Adaptable, def: ModelDef<T>, context: ModelContext = { services: {} }): T | null {
  const kind = isRequest(adaptable) ? "request" : "resource";
  if (!def.adaptables.includes(kind)) return null;

  const resource = isRequest(adaptable) ? adaptable.resource : adaptable;
  const instance = new def.type() as Record<string, unknown>;
  const ctx: InjectionContext = { adaptable, resource, context, adapt: (next, model) => adaptTo(next, model, context) };

  for (const [fieldName, spec] of Object.entries(def.fields)) {
    const result = injectors[spec.source](spec, fieldName, ctx);
    if (result.found) {
      instance[fieldName] = result.value;
    } else if ("default" in spec) {
      instance[fieldName] = spec.default;
    } else if (!(spec.optional ?? def.defaultInjectionStrategy === "optional")) {
      return null;
    }
  }

  try {
    for (const method of def.postConstruct ?? []) (instance[method] as () => void).call(instance);
  } catch {
    return null; // Sling logs the exception and adaptTo returns null
  }
  return instance as T;
}
