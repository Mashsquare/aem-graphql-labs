import { aemConfig } from "./config";
import type { AemTier } from "./client";

/**
 * Plain HTTP access to the "classic" side of AEM: HTL-rendered pages and JSON exports.
 * (Lab 17 asks you to write the JSON part yourself; the provided UI of Lab 16 uses `fetchPageHtml`.)
 */
export async function fetchPageHtml(pagePath: string, tier: AemTier = "publish"): Promise<string> {
  const host = tier === "author" ? aemConfig().authorHost : aemConfig().publishHost;
  const response = await fetch(`${host}${pagePath}.html`, { headers: { Accept: "text/html" } });
  if (!response.ok) throw new Error(`AEM answered ${response.status} for ${pagePath}.html`);
  return response.text();
}

/** A plain `.model.json` fetch for the provided UIs of Labs 18 and 19 (Lab 17 has you write the real one). */
export async function fetchPageModel<T = import("./page-model").PageModel>(pagePath: string, tier: AemTier = "publish"): Promise<T> {
  const host = tier === "author" ? aemConfig().authorHost : aemConfig().publishHost;
  const response = await fetch(`${host}${pagePath}.model.json`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`AEM answered ${response.status} for ${pagePath}.model.json`);
  return (await response.json()) as T;
}
