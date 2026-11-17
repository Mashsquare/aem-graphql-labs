import { resolveProperty, toBoolean } from "./htl";
import * as models from "./models";
import { ComponentsView } from "./ui";

export default function Exercise() {
  return <ComponentsView api={{ resolveProperty, toBoolean, models }} />;
}
