import { fetchModel, modelUrl } from "./model";
import { sanitizeRichText } from "./sanitize";
import { adaptTeaser, buildSrcSet } from "./teaser";
import { ModelView } from "./ui";

export default function Exercise() {
  return <ModelView api={{ fetchModel, modelUrl, adaptTeaser, sanitizeRichText, buildSrcSet }} />;
}
