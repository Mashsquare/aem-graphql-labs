import { aemConfig } from "@/lib/aem/config";
import { AemModelError } from "@/labs/17-sling-model-json/types";
import type { FetchModelOptions } from "@/labs/17-sling-model-json/model";

export function modelUrl(path: string): string {
  if (!path.startsWith("/content/") || path.startsWith("//")) throw new RangeError(`Not a repository path under /content/: ${JSON.stringify(path)}`);
  if (path.split("/").some((segment) => segment === ".." || segment === ".")) throw new RangeError(`Path traversal in ${JSON.stringify(path)}`);
  const resource = path.replace(/\/+$/, "").replace(/\.model\.json$/, "").replace(/\.html$/, "");
  return `${resource}.model.json`;
}

export async function fetchModel<T = unknown>(path: string, options: FetchModelOptions = {}): Promise<T> {
  const config = aemConfig();
  const url = `${options.tier === "author" ? config.authorHost : config.publishHost}${modelUrl(path)}`;
  const response = await fetch(url, { ...options.init, headers: { Accept: "application/json", ...options.headers } });
  if (!response.ok) throw new AemModelError(`AEM answered ${response.status} for ${url}`, response.status, url);
  // Login redirects and Dispatcher error pages are HTML — don't let JSON.parse produce a confusing error.
  if (!response.headers.get("content-type")?.includes("json")) {
    throw new AemModelError(`Expected JSON from ${url} but got ${response.headers.get("content-type") ?? "no content-type"}`, response.status, url);
  }
  return (await response.json()) as T;
}
