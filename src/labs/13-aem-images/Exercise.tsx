import { param, type LabViewProps } from "@/lib/lab-view";
import { AemImage } from "./AemImage";
import { buildSrcSet, getHeroImages } from "./images";
import { ImagesView, transformFrom } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
  const transform = transformFrom({
    format: param(searchParams, "format"),
    quality: param(searchParams, "quality"),
    width: param(searchParams, "width"),
  });
  return <ImagesView api={{ getHeroImages, buildSrcSet, AemImage }} transform={transform} />;
}
