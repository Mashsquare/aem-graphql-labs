import type { ImageLoaderProps } from "next/image";
import { aemQuery } from "@/lib/aem/client";
import { publicAemConfig } from "@/lib/aem/config";
import { todo } from "@/lib/todo";

export type AssetTransformFormat = "JPG" | "PNG" | "WEBP" | "GIF";

export interface TransformOptions {
  format?: AssetTransformFormat;
  quality?: number;
  width?: number;
}

export interface HeroImage {
  _path: string;
  title: string;
  primaryImage: {
    _path: string;
    _dynamicUrl: string;
    _publishUrl: string;
    _authorUrl: string;
    mimeType: string;
    width: number;
    height: number;
  } | null;
}

/**
 * Task 1 — ask AEM for web-optimized URLs. `_assetTransform` sits on the LIST (not on the image)
 * and applies to every _dynamicUrl in the result:
 *   adventureList(_locale: "en", sort: "title ASC", limit: 6,
 *                 _assetTransform: { format: $format, quality: $quality, width: $width, preferWebp: true }) { … }
 * Select _path _dynamicUrl _publishUrl _authorUrl mimeType width height on the ImageRef.
 */
export const HERO_IMAGES_QUERY = /* GraphQL */ `
  # TODO: query HeroImages($format: AssetTransformFormat, $quality: Int, $width: Int) { ... }
`;

export async function getHeroImages(transform: TransformOptions = {}): Promise<HeroImage[]> {
  void aemQuery;
  void transform;
  return todo("implement getHeroImages() in images.ts");
}

/**
 * Task 2 — a next/image loader. next/image calls it once per candidate width to build srcset.
 * `src` is a relative _dynamicUrl: resolve it against the PUBLIC publish host, then
 *  - always set `width`,
 *  - set `quality` from the argument when next/image passes one; otherwise keep a quality that
 *    _assetTransform already put in the URL, and only fall back to 75 when there is none,
 *  - keep every other existing parameter (preferwebp…).
 */
export function aemImageLoader({ src, width, quality }: ImageLoaderProps): string {
  void publicAemConfig;
  void src;
  void width;
  void quality;
  return todo("implement aemImageLoader() in images.ts");
}

/** Task 3 — the same idea for a plain <img srcSet>: "url 400w, url 800w, …" */
export function buildSrcSet(dynamicUrl: string, widths: number[]): string {
  void dynamicUrl;
  void widths;
  return todo("implement buildSrcSet() in images.ts");
}
