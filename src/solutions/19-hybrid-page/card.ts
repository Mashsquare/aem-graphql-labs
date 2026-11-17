import { aemImageUrl } from "@/lib/aem/image";
import type { Adventure, AuthoredCard, CardViewModel } from "@/labs/19-hybrid-page/types";

export function mergeCardProps(authored: AuthoredCard, fragment: Adventure | null | undefined): CardViewModel | null {
  if (!fragment) return null;
  const layout = authored.layout === "compact" ? "compact" : "full";
  const dynamicUrl = fragment.primaryImage?._dynamicUrl;
  return {
    title: fragment.title,
    href: `/adventures/${fragment.slug}`,
    meta: [fragment.activity, fragment.difficulty].filter(Boolean).join(" · "),
    layout,
    // A checkbox is `true` or absent/false. Only an explicit true shows the price.
    price: authored.showPrice === true && typeof fragment.price === "number" ? fragment.price : null,
    image: dynamicUrl
      ? { src: aemImageUrl(dynamicUrl, { width: layout === "compact" ? 480 : 960 }), width: fragment.primaryImage?.width ?? null, height: fragment.primaryImage?.height ?? null }
      : null,
  };
}
