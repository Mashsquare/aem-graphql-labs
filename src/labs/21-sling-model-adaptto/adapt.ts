import type { Adaptable, FieldSpec, InjectionContext, InjectResult, ModelContext, ModelDef } from "@/lib/sling";
import { isRequest } from "@/lib/sling";
import { todo } from "@/lib/todo";
import { injectChild, injectRequestAttribute, injectScriptVariable, injectSelf, injectService, injectValueMap, NOT_FOUND } from "./injectors";

/** Provided: picks the injector for a field spec — what `ModelAdapterFactory` does with annotations. */
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

/**
 * Task 4 — `adaptable.adaptTo(Model.class)`.
 *
 *  1. The adaptable's kind ("request" if `isRequest(adaptable)`, else "resource") must be in `def.adaptables`;
 *     otherwise return null. The resource to read is `adaptable.resource` for requests, the adaptable itself otherwise.
 *  2. Create a NEW instance: `new def.type()` (models are never cached or shared).
 *  3. For every `[fieldName, spec]` of `def.fields`, in order, call `inject(spec, fieldName, ctx)` where
 *     `ctx.adapt = (next, model) => adaptTo(next, model, context)`:
 *       found                    -> assign the value to the field
 *       not found, spec.default  -> assign the default   (`"default" in spec` — a default of `false` or `0` counts!)
 *       not found, optional      -> leave the field alone (it keeps its initial value)
 *       not found, required      -> adaptation FAILS: return null
 *     "optional" = `spec.optional` if it is set, else `def.defaultInjectionStrategy === "optional"`. Sling's default strategy is required.
 *  4. Call the `def.postConstruct` methods in order (`instance[name]()`), after ALL fields are injected.
 *     If one throws, adaptation fails: return null.
 *  5. Return the instance.
 */
export function adaptTo<T>(adaptable: Adaptable, def: ModelDef<T>, context: ModelContext = { services: {} }): T | null {
  void adaptable;
  void def;
  void context;
  void isRequest;
  return todo("implement adaptTo");
}
