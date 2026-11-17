import { AdaptView } from "@/labs/21-sling-model-adaptto/ui";
import { adaptTo } from "./adapt";

export default function Solution() {
  return <AdaptView api={{ adaptTo }} />;
}
