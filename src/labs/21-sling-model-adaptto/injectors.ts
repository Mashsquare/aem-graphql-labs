/**
 * The injectors: the objects Sling asks "do you have a value for this field?". Each returns
 *   { found: true, value }   or   { found: false }
 * and NEVER throws for a missing value. Whether "not found" is fatal is decided later, by `adaptTo`.
 *
 * Every function receives the field's spec (the "annotation"), the field name and an InjectionContext:
 *   ctx.resource    the resource the adaptable stands for (a request's resource for requests)
 *   ctx.adaptable   what `adaptTo` was called on (a Resource or a SlingRequest — see `isRequest`)
 *   ctx.context     { services } — the OSGi registry
 *   ctx.adapt(a,m)  adapt something else to a model (null on failure)
 */
import type { ChildSpec, InjectionContext, InjectResult, RequestAttributeSpec, Resource, ScriptSpec, SelfSpec, ServiceSpec, ValueMapSpec } from "@/lib/sling";
import { isRequest } from "@/lib/sling";
import { todo } from "@/lib/todo";

export const NOT_FOUND: InjectResult = { found: false };
export const found = (value: unknown): InjectResult => ({ found: true, value });

/**
 * Task 1a — `@Via`. The resource the injector reads from: `ctx.resource`, or — when the spec has `via` —
 * that relative child of it (`@Via(value = "jcr:content", type = ChildResource.class)`). `null` if the child is absent.
 */
export function baseResource(spec: { via?: string }, ctx: InjectionContext): Resource | null {
  void spec;
  void ctx;
  return todo("implement baseResource");
}

/**
 * Task 1b — `@ValueMapValue` (+ `@Named`).
 * Read `spec.named ?? fieldName` from the base resource's ValueMap, converted to `spec.type`.
 * Missing or unconvertible -> not found.
 */
export function injectValueMap(spec: ValueMapSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  void spec;
  void fieldName;
  void ctx;
  void baseResource;
  return todo("implement injectValueMap");
}

/**
 * Task 2 — `@ChildResource`. The child is `spec.named ?? fieldName`, read from the base resource.
 * What you inject depends on `spec.as` (default: "model" when `spec.model` is set, else "resource"):
 *   "resource"   the child Resource
 *   "model"      the child adapted to spec.model (ctx.adapt); adaptation failure -> not found
 *   "resources"  the child's CHILDREN as Resource[]      (Java: `@ChildResource List<Resource> items`)
 *   "models"     the child's children, each adapted; children that do not adapt are left out
 * No such child -> not found.
 */
export function injectChild(spec: ChildSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  void spec;
  void fieldName;
  void ctx;
  return todo("implement injectChild");
}

/**
 * Task 3a — `@Self`. Without `spec.model`: the adaptable itself (Resource or request).
 * With `spec.model`: the adaptable adapted to that model; failure -> not found.
 * (Ignore `spec.viaSuperType` — Lab 23.)
 */
export function injectSelf(spec: SelfSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  void spec;
  void fieldName;
  void ctx;
  return todo("implement injectSelf");
}

/** Task 3b — `@OSGiService`: `ctx.context.services[spec.service]`; not registered -> not found. */
export function injectService(spec: ServiceSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  void spec;
  void fieldName;
  void ctx;
  return todo("implement injectService");
}

/**
 * Task 3c — `@ScriptVariable`: `ctx.adaptable.bindings[spec.named ?? fieldName]`.
 * Only available when adapting from a *request* (`isRequest`); otherwise, and when the binding is absent, not found.
 */
export function injectScriptVariable(spec: ScriptSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  void spec;
  void fieldName;
  void ctx;
  void isRequest;
  return todo("implement injectScriptVariable");
}

/** Task 3d — `@RequestAttribute`: same as 3c but reads `attributes`. */
export function injectRequestAttribute(spec: RequestAttributeSpec, fieldName: string, ctx: InjectionContext): InjectResult {
  void spec;
  void fieldName;
  void ctx;
  return todo("implement injectRequestAttribute");
}
