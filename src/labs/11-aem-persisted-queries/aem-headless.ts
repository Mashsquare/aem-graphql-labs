import { AEMHeadless } from "@adobe/aem-headless-client-js";
import { aemConfig } from "@/lib/aem/config";
import { todo } from "@/lib/todo";

/**
 * Task 1 — two SDK clients.
 *
 * Gotchas the SDK will hit you with:
 *  - `endpoint` defaults to content/graphql/global/endpoint.json — wrong for wknd-shared.
 *  - Outside the browser you must pass `fetch` (wrap it: `fetch: (url, init) => fetch(url, init)`).
 *  - `auth` as [user, password] means Basic auth; a string means Bearer token.
 */

/** Anonymous client for AEM Publish. */
export function createPublishClient(): AEMHeadless {
  void AEMHeadless;
  void aemConfig;
  return todo("implement createPublishClient() in aem-headless.ts");
}

/**
 * Authenticated client for AEM Author — used by the persist script, never by browser code.
 * Credentials: AEM_AUTHOR_USER / AEM_AUTHOR_PASSWORD (default admin/admin, like the local AEM SDK).
 */
export function createAuthorClient(): AEMHeadless {
  return todo("implement createAuthorClient() in aem-headless.ts");
}
