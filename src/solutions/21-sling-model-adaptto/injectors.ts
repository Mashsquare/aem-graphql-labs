import type { ChildSpec, InjectionContext, InjectResult, RequestAttributeSpec, Resource, ScriptSpec, SelfSpec, ServiceSpec, ValueMapSpec } from "@/lib/sling";
import { isRequest } from "@/lib/sling";

export const NOT_FOUND: InjectResult = { found: false };
export const found = (value: unknown): InjectResult => ({ found: true, value });

export function baseResource(spec: { via?: string }, ctx: InjectionContext): Resource | null {
  return spec.via === undefined ? ctx.resource : ctx.resource.getChild(spec.via);
}

export function injectValueMap(spec: ValueMapSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  const value = baseResource(spec, ctx)?.getValueMap().get(spec.named ?? fieldName, spec.type) ?? null;
  return value === null ? NOT_FOUND : found(value);
}

export function injectChild(spec: ChildSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  const target = baseResource(spec, ctx)?.getChild(spec.named ?? fieldName);
  if (!target) return NOT_FOUND;

  const as = spec.as ?? (spec.model ? "model" : "resource");
  const model = spec.model;
  switch (as) {
    case "resource":
      return found(target);
    case "resources":
      return found(target.listChildren());
    case "model": {
      const adapted = model ? ctx.adapt(target, model) : null;
      return adapted === null ? NOT_FOUND : found(adapted);
    }
    case "models":
      return found(target.listChildren().map((resource) => (model ? ctx.adapt(resource, model) : null)).filter((adapted) => adapted !== null));
  }
}

export function injectSelf(spec: SelfSpec, _fieldName: string, ctx: InjectionContext): InjectResult {
  if (!spec.model) return found(ctx.adaptable);
  const adapted = ctx.adapt(ctx.adaptable, spec.model);
  return adapted === null ? NOT_FOUND : found(adapted);
}

export function injectService(spec: ServiceSpec, _fieldName: string, ctx: InjectionContext): InjectResult {
  return spec.service in ctx.context.services ? found(ctx.context.services[spec.service]) : NOT_FOUND;
}

export function injectScriptVariable(spec: ScriptSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  if (!isRequest(ctx.adaptable)) return NOT_FOUND;
  const name = spec.named ?? fieldName;
  return name in ctx.adaptable.bindings ? found(ctx.adaptable.bindings[name]) : NOT_FOUND;
}

export function injectRequestAttribute(spec: RequestAttributeSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  if (!isRequest(ctx.adaptable)) return NOT_FOUND;
  const name = spec.named ?? fieldName;
  return name in ctx.adaptable.attributes ? found(ctx.adaptable.attributes[name]) : NOT_FOUND;
}
