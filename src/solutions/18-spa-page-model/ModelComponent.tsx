import type { ReactNode } from "react";
import type { ModelComponentProps } from "@/labs/18-spa-page-model/types";
import { childrenOf } from "./model";

export function ModelComponent({ model, mapping, isInEditor = false }: ModelComponentProps): ReactNode {
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
    // Authors will drop components the SPA does not know. Visible to them, invisible to visitors.
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
