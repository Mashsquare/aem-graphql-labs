import { todo } from "@/lib/todo";
import type { AemEvent } from "./types";

/**
 * Task 6 — which cache tags does an AEM event invalidate?
 *   - only *.published / *.unpublished events matter (Publish didn't change on *.modified)
 *   - adventure fragment            -> [ADVENTURES_TAG, adventureTag(slug)]  (just ADVENTURES_TAG without a slug)
 *   - location fragment             -> [ADVENTURES_TAG]                       (shown on every adventure page)
 *   - persisted query (aem.graphql.persistedQuery.*) -> [ADVENTURES_TAG]
 *   - anything else (articles, authors) -> []
 */
export function tagsForEvent(event: AemEvent): string[] {
  void event;
  return todo("implement tagsForEvent() in aem-events.ts");
}

/**
 * Task 7 — the webhook AEM calls when content is (un)published: POST /api/aem-events
 *   - header x-aem-webhook-secret must equal AEM_WEBHOOK_SECRET (default "mock-webhook-secret") -> else 401
 *   - invalid JSON -> 400
 *   - revalidateTag(tag, { expire: 0 }) for every tag from tagsForEvent (import from "next/cache")
 *   - answer Response.json({ type: event.type, revalidated: tags })
 */
export async function POST(request: Request): Promise<Response> {
  void request;
  return todo("implement the webhook POST handler in aem-events.ts");
}
