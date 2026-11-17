import { IslandsView } from "@/labs/16-htl-react-islands/ui";
import { mountIslands } from "./islands";
import { safeHref } from "./links";
import { PriceTag } from "./PriceTag";

export default function Solution() {
  return <IslandsView api={{ mountIslands, PriceTag, safeHref }} page="/content/wknd/us/en/adventures" />;
}
