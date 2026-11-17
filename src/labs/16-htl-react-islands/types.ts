/** Types for Lab 16 — provided. */
import type { ComponentType, ReactNode } from "react";

/**
 * The slice of an HTMLElement the lab needs. A real `HTMLElement` satisfies it
 * (`dataset` is a `DOMStringMap`), and so does the fake the tests use — which means your code
 * runs in plain Node, with no browser.
 *
 * `data-price-label="x"` shows up as `dataset.priceLabel`. A bare attribute (`data-sale`) is `""`.
 */
export interface IslandElement {
  dataset: Record<string, string | undefined>;
}

/** What `document` offers: find elements, and find a `<script type="application/json">` by id. */
export interface IslandHost {
  querySelectorAll(selector: string): Iterable<IslandElement>;
  getElementById(id: string): { textContent: string | null } | null;
}

/** Component name (the value of `data-react-component`) -> React component. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each component has its own props type
export type Registry = Record<string, ComponentType<any>>;

/** In the browser: `(element, node) => { const root = createRoot(element); root.render(node); return root; }` */
export type MountFn = (element: IslandElement, node: ReactNode) => { unmount(): void };

export type ErrorHandler = (error: Error, element: IslandElement) => void;

export interface MountedIsland {
  name: string;
  element: IslandElement;
  props: Record<string, unknown>;
  unmount(): void;
}

/** Thrown when an author-controlled props payload cannot be read. */
export class PropsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PropsError";
  }
}
