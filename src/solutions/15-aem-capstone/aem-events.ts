import { revalidateTag } from "next/cache";
import type { AemEvent } from "@/labs/15-aem-capstone/types";
import { ADVENTURES_TAG, adventureTag } from "./data";

export function tagsForEvent(event: AemEvent): string[] {
  // *.modified happens on Author only — Publish (what the site renders) didn't change.
  if (!/\.(published|unpublished)$/.test(event.type)) return [];
  if (event.type.startsWith("aem.graphql.persistedQuery.")) return [ADVENTURES_TAG];
  switch (event.data.model) {
    case "adventure":
      return event.data.slug ? [ADVENTURES_TAG, adventureTag(event.data.slug)] : [ADVENTURES_TAG];
    case "location":
      // Locations are shown on every adventure page.
      return [ADVENTURES_TAG];
    default:
      return [];
  }
}

export async function POST(request: Request): Promise<Response> {
  if (request.headers.get("x-aem-webhook-secret") !== (process.env.AEM_WEBHOOK_SECRET ?? "mock-webhook-secret")) {
    return new Response("Unauthorized", { status: 401 });
  }
  let event: AemEvent;
  try {
    event = (await request.json()) as AemEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const tags = tagsForEvent(event);
  // From a webhook, expire immediately; { expire: 0 } means the next request re-fetches.
  // (revalidateTag(tag, "max") would serve stale content once while refreshing in the background.)
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ type: event.type, revalidated: tags });
}
