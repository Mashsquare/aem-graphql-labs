import { AEMHeadless } from "@adobe/aem-headless-client-js";
import { aemConfig } from "@/lib/aem/config";

// Next.js extends fetch (caching, revalidate); wrapping keeps that and avoids "Illegal invocation"
// when the SDK calls it as a method.
const fetchForSdk = (input: string, init?: RequestInit) => fetch(input, init);

export function createPublishClient(): AEMHeadless {
  const { publishHost, endpoint } = aemConfig();
  return new AEMHeadless({ serviceURL: publishHost, endpoint, fetch: fetchForSdk });
}

export function createAuthorClient(): AEMHeadless {
  const { authorHost, endpoint } = aemConfig();
  return new AEMHeadless({
    serviceURL: authorHost,
    endpoint,
    // [user, password] -> Basic auth (local SDK). A string would be sent as a Bearer token
    // (e.g. a developer token from the AEM as a Cloud Service Developer Console).
    auth: [process.env.AEM_AUTHOR_USER ?? "admin", process.env.AEM_AUTHOR_PASSWORD ?? "admin"],
    fetch: fetchForSdk,
  });
}
