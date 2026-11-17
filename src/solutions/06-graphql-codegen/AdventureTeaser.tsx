import { Badge, MediaCard, formatPrice } from "@/components/lab-ui";
import { aemImageUrl } from "@/lib/aem/image";
import { adventureTeaserFragment } from "./documents";
import { getFragmentData, type FragmentType } from "./gql";

export function AdventureTeaser(props: { adventure: FragmentType<typeof adventureTeaserFragment> }) {
  // Only the component that declared the fragment can read its fields.
  const adventure = getFragmentData(adventureTeaserFragment, props.adventure);

  // __typename narrows the Reference union to ImageRef.
  const image = adventure.primaryImage?.__typename === "ImageRef" ? adventure.primaryImage : null;
  return (
    <MediaCard
      title={adventure.title}
      imageUrl={image?._dynamicUrl ? aemImageUrl(image._dynamicUrl, { width: 600 }) : null}
      badge={<Badge tone="accent">{adventure.activity}</Badge>}
      meta={[formatPrice(adventure.price), adventure.tripLength, adventure.difficulty]}
    />
  );
}
