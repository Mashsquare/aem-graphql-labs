import type { ImageLoaderProps } from "next/image";
import { publicAemConfig } from "./config";

/**
 * AEM web-optimized image delivery: `_dynamicUrl` is relative and accepts query parameters
 * (width, quality, preferwebp, ...). These helpers make it absolute and adjust the parameters.
 */
export function aemImageUrl(dynamicUrl: string, params: { width?: number; quality?: number } = {}): string {
  const url = new URL(dynamicUrl, publicAemConfig().publishHost);
  if (params.width) url.searchParams.set("width", String(params.width));
  if (params.quality) url.searchParams.set("quality", String(params.quality));
  return url.toString();
}

/**
 * A next/image loader: <Image loader={aemImageLoader} src={image._dynamicUrl} ... />
 * next/image sets the width; quality is only overridden when the quality prop is set, so a
 * quality from _assetTransform survives.
 */
export function aemImageLoader({ src, width, quality }: ImageLoaderProps): string {
  return aemImageUrl(src, { width, quality });
}
