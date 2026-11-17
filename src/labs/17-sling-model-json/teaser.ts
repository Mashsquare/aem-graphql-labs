import { todo } from "@/lib/todo";
import type { TeaserModel } from "@/lib/aem/page-model";
import type { TeaserViewModel } from "./types";

/**
 * Task 4a — Core Components export an image as a *template*, because renditions are generated per width:
 *
 *   srcUriTemplate: "/content/…/hero.coreimg{.width}.jpeg/1730000000000/<uuid>/hero.jpg"
 *
 * Replace `{.width}` with `.<width>` for each width and build an `srcset` attribute value with ABSOLUTE
 * URLs on the Publish host (`publicAemConfig().publishHost`):
 *
 *   "http://host/…hero.coreimg.320.jpeg/… 320w, http://host/…hero.coreimg.800.jpeg/… 800w"
 *
 * Widths are used in the order given. A template without `{.width}` -> throw an Error (it is not a template).
 */
export function buildSrcSet(srcUriTemplate: string, widths: number[]): string {
  void srcUriTemplate;
  void widths;
  return todo("implement buildSrcSet in teaser.ts");
}

/**
 * Task 4b — the anti-corruption layer: map the Core Teaser export to what your component needs.
 *
 *   heading / headingLevel   <- title / titleType        (headingLevel falls back to "h2" when absent)
 *   bodyHtml                 <- sanitizeRichText(description)          (Task 3 — the export is NOT filtered)
 *   href                     <- toRoute(linkURL)                       (Task 2)
 *   image                    <- { src: absolute URL of image.src, srcSet: buildSrcSet(template, widths), alt }
 *                               widths = image.widths, or [320, 640, 1200] when the export has none; null if no image.src
 *   actions                  <- actions[] with a usable href (toRoute !== undefined) only:
 *                               { id, label: title, href: toRoute(url), external: starts with http(s):// }
 *                               An empty `actionsEnabled: false` list means no actions.
 */
export function adaptTeaser(model: TeaserModel): TeaserViewModel {
  void model;
  return todo("implement adaptTeaser in teaser.ts");
}
