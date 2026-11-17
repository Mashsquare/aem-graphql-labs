import { ComponentsView } from "@/labs/22-sling-models-components/ui";
import { resolveProperty, toBoolean } from "./htl";
import * as models from "./models";

export default function Solution() {
  return <ComponentsView api={{ resolveProperty, toBoolean, models }} />;
}
