import { Badge, MediaCard, formatPrice } from "@/components/lab-ui";
import { aemImageUrl } from "@/lib/aem/image";
import { todo } from "@/lib/todo";
import type { adventureTeaserFragment } from "./documents";
import type { FragmentType } from "./gql";
import type { AdventureTeaserFragment } from "./gql/graphql";

/**
 * The prop is a *masked* fragment reference: the parent query result cannot read `title` etc.
 * directly — only this component, which declared the fragment, can unmask it.
 */
export function AdventureTeaser(props: { adventure: FragmentType<typeof adventureTeaserFragment> }) {
  // TODO (task 5): const adventure = getFragmentData(adventureTeaserFragment, props.adventure);
  // (import { getFragmentData } from "./gql" and adventureTeaserFragment as a value)
  void props;
  const adventure = todo("unmask the fragment with getFragmentData() in AdventureTeaser.tsx") as AdventureTeaserFragment;

  const image = adventure.primaryImage?.__typename === "ImageRef" ? adventure.primaryImage : null;
  return (
    <MediaCard
      title={adventure.title}
      imageUrl={image?._dynamicUrl ? aemImageUrl(image._dynamicUrl, { width: 600 }) : null}
      badge={<Badge tone="accent">{adventure.activity}</Badge>}
      meta={[formatPrice(adventure.price), adventure.tripLength /* TODO (task 6): add the difficulty */]}
    />
  );
}
