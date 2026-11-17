"use client";

import Image from "next/image";
import type { AemImageProps } from "@/labs/13-aem-images/AemImage";
import { aemImageLoader } from "./images";

export function AemImage({ image, alt, sizes, preload, quality, className }: AemImageProps) {
  return (
    <Image
      // Our loader builds AEM delivery URLs; Next.js' own image optimizer is not involved.
      loader={aemImageLoader}
      src={image._dynamicUrl}
      width={image.width}
      height={image.height}
      alt={alt}
      sizes={sizes}
      preload={preload}
      quality={quality}
      className={className}
    />
  );
}
