import type { Adaptable, FieldSpec, InjectionContext, InjectResult, ModelContext, ModelDef } from "@/lib/sling";
import { isRequest } from "@/lib/sling";
import { injectChild, injectRequestAttribute, injectScriptVariable, injectSelf, injectService, injectValueMap, NOT_FOUND } from "./injectors";

export function inject(spec: FieldSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  switch (spec.source) {
    case "valueMap":
      return injectValueMap(spec, fieldName, ctx);
    case "child":
      return injectChild(spec, fieldName, ctx);
    case "self":
      return injectSelf(spec, fieldName, ctx);
    case "osgi":
      return injectService(spec, fieldName, ctx);
    case "script":
      return injectScriptVariable(spec, fieldName, ctx);
    case "requestAttribute":
      return injectRequestAttribute(spec, fieldName, ctx);
    default:
      return NOT_FOUND;
  }
}

export function adaptTo<T>(adaptable: Adaptable, def: ModelDef<T>, context: ModelContext = { services: {} }): T | null {
  // 1. Can this model be adapted from this kind of thing at all?
  const request = isRequest(adaptable);
  if (!def.adaptables.includes(request ? "request" : "resource")) return null;
  const resource = request ? adaptable.resource : adaptable;

  // 2. Every call builds a new instance.
  const instance = new def.type() as Record<string, unknown>;
  const ctx: InjectionContext = { adaptable, resource, context, adapt: (next, model) => adaptTo(next, model, context) };

  // 3. Inject field by field.
  for (const [fieldName, spec] of Object.entries(def.fields)) {
    const result = inject(spec, fieldName, ctx);
    if (result.found) {
      instance[fieldName] = result.value;
    } else if ("default" in spec) {
      instance[fieldName] = spec.default;
    } else if (!(spec.optional ?? def.defaultInjectionStrategy === "optional")) {
      return null; // required and missing: the model does not exist
    }
  }

  // 4. @PostConstruct, after everything is injected. An exception means "no model".
  try {
    for (const method of def.postConstruct ?? []) (instance[method] as () => void).call(instance);
  } catch {
    return null;
  }
  return instance as T;
}
