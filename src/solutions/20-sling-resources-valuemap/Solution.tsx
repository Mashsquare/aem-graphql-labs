import { ResourcesView } from "@/labs/20-sling-resources-valuemap/ui";
import { coerce } from "./coerce";
import { inheritedProperty } from "./inherit";
import { normalizePath } from "./paths";
import { isResourceType, typeChain } from "./supertype";

export default function Solution() {
  return <ResourcesView api={{ coerce, normalizePath, typeChain, isResourceType, inheritedProperty }} />;
}
