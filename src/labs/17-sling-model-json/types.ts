/** Types for Lab 17 — provided. */
import type { ModelNode } from "@/lib/aem/page-model";

/** Thrown by fetchModel for anything that is not a JSON model. */
export class AemModelError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "AemModelError";
  }
}

export type { ModelNode };

/** What your React teaser wants — decoupled from the shape of the Core Component export. */
export interface TeaserViewModel {
  heading: string;
  headingLevel: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  /** Already sanitised HTML. */
  bodyHtml: string;
  /** App route (or external URL) for the heading, undefined when the author left it empty or it is unsafe. */
  href: string | undefined;
  image: { src: string; srcSet: string; alt: string } | null;
  actions: { id: string; label: string; href: string; external: boolean }[];
}
