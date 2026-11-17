import { coerce } from "./coerce";
import { inheritedProperty } from "./inherit";
import { normalizePath } from "./paths";
import { isResourceType, typeChain } from "./supertype";
import { ResourcesView } from "./ui";

export default function Exercise() {
  return <ResourcesView api={{ coerce, normalizePath, typeChain, isResourceType, inheritedProperty }} />;
}
