import { todo } from "@/lib/todo";
import type { AemTier } from "@/lib/aem/client";

/**
 * Task 1a — the URL of a model export. The Sling Model Exporter answers on the `model` selector with
 * the `json` extension:  <resource path>.model.json
 *
 *   "/content/wknd/us/en/featured"                          -> "/content/wknd/us/en/featured.model.json"
 *   "/content/wknd/us/en/featured.html"                     -> same            (strip a .html extension)
 *   "/content/wknd/us/en/featured/"                         -> same            (strip a trailing slash)
 *   "/content/wknd/us/en/featured.model.json"               -> unchanged
 *   "/content/wknd/us/en/jcr:content/root/container/hero"   -> "…/hero.model.json"   (one component)
 *
 * The path often comes from a URL or a query string, so refuse anything that is not a repository path
 * under /content/: throw a RangeError for "https://evil.example/x", "//evil.example", "/etc/passwd",
 * "/content/../etc/passwd" and the empty string.
 */
export function modelUrl(path: string): string {
  void path;
  return todo("implement modelUrl in model.ts");
}

export interface FetchModelOptions {
  tier?: AemTier;
  /** e.g. { Authorization: "Basic …" } for Author. */
  headers?: HeadersInit;
  init?: RequestInit;
}

/**
 * Task 1b — GET the model from the right host (`aemConfig()` from "@/lib/aem/config": publishHost / authorHost),
 * send `Accept: application/json` and return the parsed JSON, typed as T.
 *
 * Throw `AemModelError` (from ./types; message, status, url) when
 *   - the response is not ok (404 for a missing page, 401 on Author without credentials, 403 …), or
 *   - the body is not JSON (check the content-type) — SSO and error pages are HTML with status 200 more often than you think.
 */
export async function fetchModel<T = unknown>(path: string, options: FetchModelOptions = {}): Promise<T> {
  void path;
  void options;
  return todo("implement fetchModel in model.ts");
}
