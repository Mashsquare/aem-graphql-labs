import { ModelView } from "@/labs/17-sling-model-json/ui";
import { fetchModel, modelUrl } from "./model";
import { sanitizeRichText } from "./sanitize";
import { adaptTeaser, buildSrcSet } from "./teaser";

export default function Solution() {
  return <ModelView api={{ fetchModel, modelUrl, adaptTeaser, sanitizeRichText, buildSrcSet }} />;
}
