import { exportResource } from "./container";
import { wrapAsSuperType } from "./delegate";
import { selectModel } from "./select";
import { serialize } from "./serialize";
import { ExporterView } from "./ui";

export default function Exercise() {
  return <ExporterView api={{ serialize, selectModel, wrapAsSuperType, exportResource }} />;
}
