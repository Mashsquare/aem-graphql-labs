import { ExporterView } from "@/labs/23-sling-exporter-delegation/ui";
import { exportResource } from "./container";
import { wrapAsSuperType } from "./delegate";
import { selectModel } from "./select";
import { serialize } from "./serialize";

export default function Solution() {
  return <ExporterView api={{ serialize, selectModel, wrapAsSuperType, exportResource }} />;
}
