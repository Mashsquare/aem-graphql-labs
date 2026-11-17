/** Types for Lab 18 — provided. */
import type { ComponentType } from "react";
import type { ModelNode } from "@/lib/aem/page-model";

/**
 * How a mapped component behaves in the page editor (Adobe: `EditConfig`).
 * `isEmpty` decides when the author sees a placeholder instead of the component.
 */
export interface EditConfig<P = Record<string, unknown>> {
  /** Text of the placeholder, e.g. "Adventure card". Default: "Component". */
  emptyLabel?: string;
  isEmpty?: (props: P) => boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each component has its own props
export type AnyComponent = ComponentType<any>;

export interface MappedComponent {
  Component: AnyComponent;
  editConfig?: EditConfig<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Adobe's `MapTo(resourceType)(Component, editConfig)`, without the global registry. */
export interface Mapping {
  MapTo(resourceTypes: string | string[]): <C extends AnyComponent>(Component: C, editConfig?: EditConfig<any>) => C; // eslint-disable-line @typescript-eslint/no-explicit-any
  get(resourceType: string): MappedComponent | undefined;
}

export interface ModelComponentProps {
  model: ModelNode;
  mapping: Mapping;
  /** true inside the AEM page editor (Author, ?wcmmode=edit) */
  isInEditor?: boolean;
}
