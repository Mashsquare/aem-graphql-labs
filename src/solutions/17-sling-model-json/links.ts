import { publicAemConfig } from "@/lib/aem/config";
import { safeHref } from "@/lib/aem/safe-href";
import { SITE_ROOT } from "@/labs/17-sling-model-json/links";

export function toRoute(linkURL: string | null | undefined, siteRoot: string = SITE_ROOT): string | undefined {
  const safe = safeHref(linkURL);
  if (!safe) return undefined;
  if (!safe.startsWith("/")) return safe; // https://…, mailto:…, relative paths

  const [, pathname, suffix = ""] = /^([^?#]*)(.*)$/.exec(safe) ?? [];
  if (pathname.startsWith("/content/dam/")) return new URL(safe, publicAemConfig().publishHost).toString();

  // Segment boundary: "/content/wknd/us/english" must not match the root "/content/wknd/us/en".
  if (pathname !== siteRoot && !pathname.startsWith(`${siteRoot}/`) && pathname !== `${siteRoot}.html`) return safe;
  const route = pathname.slice(siteRoot.length).replace(/\.html$/, "").replace(/\/+$/, "");
  return `${route || "/"}${suffix}`;
}
