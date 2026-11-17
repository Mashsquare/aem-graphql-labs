import type { ImageLoaderProps } from "next/image";
import { aemQuery } from "@/lib/aem/client";
import { publicAemConfig } from "@/lib/aem/config";
import type { HeroImage, TransformOptions } from "@/labs/13-aem-images/images";

export const HERO_IMAGES_QUERY = /* GraphQL */ `
  query HeroImages($format: AssetTransformFormat, $quality: Int, $width: Int) {
    adventureList(
      _locale: "en"
      sort: "title ASC"
      limit: 6
      _assetTransform: { format: $format, quality: $quality, width: $width, preferWebp: true }
    ) {
      items {
        _path
        title
        primaryImage {
          ... on ImageRef {
            _path
            _dynamicUrl
            _publishUrl
            _authorUrl
            mimeType
            width
            height
          }
        }
      }
    }
  }
`;

export async function getHeroImages(transform: TransformOptions = {}): Promise<HeroImage[]> {
  // Unset variables are simply omitted — AEM then uses the original format/quality/size.
  const data = await aemQuery<{ adventureList: { items: HeroImage[] } }>(HERO_IMAGES_QUERY, { ...transform });
  return data.adventureList.items;
}

export function aemImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // _dynamicUrl is relative to the AEM origin; the browser needs an absolute URL.
  const url = new URL(src, publicAemConfig().publishHost);
  // next/image decides the width of every srcset candidate.
  url.searchParams.set("width", String(width));
  // Quality: an explicit quality prop wins, then whatever _assetTransform already put in the URL.
  if (quality) url.searchParams.set("quality", String(quality));
  else if (!url.searchParams.has("quality")) url.searchParams.set("quality", "75");
  return url.toString();
}

export function buildSrcSet(dynamicUrl: string, widths: number[]): string {
  return widths.map((width) => `${aemImageLoader({ src: dynamicUrl, width })} ${width}w`).join(", ");
}
