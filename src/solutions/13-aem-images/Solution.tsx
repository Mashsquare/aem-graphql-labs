import { param, type LabViewProps } from "@/lib/lab-view";
import { ImagesView, transformFrom } from "@/labs/13-aem-images/ui";
import { AemImage } from "./AemImage";
import { buildSrcSet, getHeroImages } from "./images";

export default function Solution({ searchParams }: LabViewProps) {
  const transform = transformFrom({
    format: param(searchParams, "format"),
    quality: param(searchParams, "quality"),
    width: param(searchParams, "width"),
  });
  return <ImagesView api={{ getHeroImages, buildSrcSet, AemImage }} transform={transform} />;
}
