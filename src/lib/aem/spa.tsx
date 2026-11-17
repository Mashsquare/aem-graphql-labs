/**
 * A small SPA-Editor-style renderer for AEM page models (the reference solution of Lab 18, in one file).
 * Lab 19 builds on it. For a real SPA Editor project use Adobe's `@adobe/aem-react-editable-components`.
 */
import type { ComponentType, ReactNode } from "react";
import type { ModelNode } from "./page-model";

export interface EditConfig<P = Record<string, unknown>> {
  emptyLabel?: string;
  isEmpty?: (props: P) => boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each component has its own props
type AnyComponent = ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MappedComponent { Component: AnyComponent; editConfig?: EditConfig<any> }

export interface Mapping {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MapTo(resourceTypes: string | string[]): <C extends AnyComponent>(Component: C, editConfig?: EditConfig<any>) => C;
  get(resourceType: string): MappedComponent | undefined;
}

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

export function childrenOf(model: ModelNode): { key: string; model: ModelNode }[] {
  const items = model[":items"];
  if (!items) return [];
  return (model[":itemsOrder"] ?? Object.keys(items)).flatMap((key) => (Object.hasOwn(items, key) ? [{ key, model: items[key] }] : []));
}

export function ModelComponent({ model, mapping, isInEditor = false }: { model: ModelNode; mapping: Mapping; isInEditor?: boolean }): ReactNode {
  const type = model[":type"];
  const mapped = mapping.get(type);
  const cqPath = model[":path"];
  const editAttributes = isInEditor && cqPath ? { "data-cq-data-path": cqPath } : {};

  const props: Record<string, unknown> = { cqPath, isInEditor };
  for (const [key, value] of Object.entries(model)) if (!key.startsWith(":")) props[key] = value;

  const isContainer = model[":items"] !== undefined;
  const grid = isContainer ? (
    <div className={model.gridClassNames} {...(mapped ? {} : editAttributes)}>
      {childrenOf(model).map(({ key, model: child }) => (
        <div key={key} className={model.columnClassNames?.[key]}>
          <ModelComponent model={child} mapping={mapping} isInEditor={isInEditor} />
        </div>
      ))}
    </div>
  ) : null;

  if (!mapped) {
    if (isContainer) return grid;
    return isInEditor ? (
      <div className="aem-unmapped" {...editAttributes}>
        Unmapped component: {type}
      </div>
    ) : null;
  }
  const { Component, editConfig } = mapped;
  const rendered = isContainer ? <Component {...props}>{grid}</Component> : <Component {...props} />;
  const content = isInEditor && editConfig?.isEmpty?.(props) ? <div className="cq-placeholder" data-emptytext={editConfig.emptyLabel ?? "Component"} /> : rendered;
  return isInEditor ? <div {...editAttributes}>{content}</div> : content;
}
