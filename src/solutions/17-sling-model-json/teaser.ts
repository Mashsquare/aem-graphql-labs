import { publicAemConfig } from "@/lib/aem/config";
import type { TeaserModel } from "@/lib/aem/page-model";
import type { TeaserViewModel } from "@/labs/17-sling-model-json/types";
import { toRoute } from "./links";
import { sanitizeRichText } from "./sanitize";

const absolute = (path: string) => new URL(path, publicAemConfig().publishHost).toString();

export function buildSrcSet(srcUriTemplate: string, widths: number[]): string {
  if (!srcUriTemplate.includes("{.width}")) throw new Error(`Not a srcUriTemplate (no {.width}): ${srcUriTemplate}`);
  return widths.map((width) => `${absolute(srcUriTemplate.replace("{.width}", `.${width}`))} ${width}w`).join(", ");
}

export function adaptTeaser(model: TeaserModel): TeaserViewModel {
  const image = model.image?.src
    ? {
        src: absolute(model.image.src),
        srcSet: buildSrcSet(model.image.srcUriTemplate, model.image.widths?.length ? model.image.widths : [320, 640, 1200]),
        alt: model.image.alt ?? "",
      }
    : null;

  const actions = (model.actionsEnabled ? model.actions : []).flatMap((action) => {
    const href = toRoute(action.url);
    return href ? [{ id: action.id, label: action.title, href, external: /^https?:\/\//i.test(href) }] : [];
  });

  return {
    heading: model.title,
    headingLevel: model.titleType ?? "h2",
    bodyHtml: sanitizeRichText(model.description ?? ""),
    href: toRoute(model.linkURL),
    image,
    actions,
  };
}
