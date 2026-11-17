import { todo } from "@/lib/todo";

/** The site root all links of this lab live under (the "mapping": /content/wknd/us/en -> /). */
export const SITE_ROOT = "/content/wknd/us/en";

/**
 * Task 2 — links in a model export are *repository paths*, not URLs of your app. Map them.
 *
 *   /content/wknd/us/en/adventures.html            -> /adventures
 *   /content/wknd/us/en.html                       -> /
 *   /content/wknd/us/en/magazine.html#latest       -> /magazine#latest        (keep ?query and #fragment)
 *   /content/wknd/us/en/a/b                        -> /a/b                    (extension is optional)
 *   /content/wknd/us/english/x.html                -> unchanged               (NOT inside the site: "en" is not "english")
 *   /content/wknd/us/fr/x.html                     -> unchanged               (another site root: the caller decides)
 *   /content/dam/wknd-shared/en/…/map.pdf          -> absolute URL on the Publish host (publicAemConfig().publishHost)
 *   https://www.surf-forecast.com, mailto:…        -> unchanged
 *   javascript:…, undefined, ""                    -> undefined
 *
 * Use `safeHref` from "@/lib/aem/safe-href" as the last gate.
 */
export function toRoute(linkURL: string | null | undefined, siteRoot: string = SITE_ROOT): string | undefined {
  void linkURL;
  void siteRoot;
  return todo("implement toRoute in links.ts");
}
