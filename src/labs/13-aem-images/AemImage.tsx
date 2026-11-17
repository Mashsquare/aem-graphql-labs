"use client";

/**
 * Task 4 — a reusable image component for AEM assets.
 *
 * next/image's `loader` prop is a FUNCTION, and functions can't be passed from Server to Client
 * Components. That's why this wrapper is a Client Component that imports the loader itself.
 *
 *   <Image loader={aemImageLoader} src={image._dynamicUrl} width={image.width} height={image.height}
 *          alt={alt} sizes={sizes} preload={preload} quality={quality} />
 *
 * width/height come from the ImageRef, so the browser reserves space (no layout shift).
 */
import { todo } from "@/lib/todo";

export interface AemImageProps {
  image: { _dynamicUrl: string; width: number; height: number };
  alt: string;
  sizes?: string;
  preload?: boolean;
  quality?: number;
  className?: string;
}

export function AemImage(props: AemImageProps) {
  void props;
  return todo("implement AemImage in AemImage.tsx with next/image + aemImageLoader");
}
