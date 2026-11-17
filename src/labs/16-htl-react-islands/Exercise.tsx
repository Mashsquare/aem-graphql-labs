import { mountIslands } from "./islands";
import { safeHref } from "./links";
import { PriceTag } from "./PriceTag";
import { IslandsView } from "./ui";

export default function Exercise() {
  return <IslandsView api={{ mountIslands, PriceTag, safeHref }} page="/content/wknd/us/en/adventures" />;
}
