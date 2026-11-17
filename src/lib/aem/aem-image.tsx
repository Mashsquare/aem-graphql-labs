"use client";

import Image from "next/image";
import { aemImageLoader } from "./image";

/** next/image for AEM web-optimized delivery (the reusable version of the Lab 13 exercise). */
export function AemImage({
  image,
  alt,
  sizes,
  preload,
  className,
}: {
  image: { _dynamicUrl: string; width: number; height: number };
  alt: string;
  sizes?: string;
  preload?: boolean;
  className?: string;
}) {
  return (
    <Image
      loader={aemImageLoader}
      src={image._dynamicUrl}
      width={image.width}
      height={image.height}
      alt={alt}
      sizes={sizes}
      preload={preload}
      className={className}
    />
  );
}
