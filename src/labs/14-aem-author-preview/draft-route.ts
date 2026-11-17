import { todo } from "@/lib/todo";

/**
 * Task 3 — the preview entry point AEM opens for editors:
 *   GET /api/lab14/draft?secret=<PREVIEW_SECRET>&slug=<adventure slug>
 * (wired up in src/app/api/lab14/draft/route.ts)
 *
 *  1. secret !== process.env.PREVIEW_SECRET (default "lab-preview-secret") -> 401
 *  2. slug missing                                                          -> 400
 *  3. look the adventure up ON AUTHOR (getAdventureBySlug(slug, true)); not found -> 404
 *  4. (await draftMode()).enable()       — import { draftMode } from "next/headers"
 *  5. redirect to `${WORKSPACE}?slug=${adventure.slug}` — use the slug from AEM, never the raw
 *     query parameter (open-redirect protection). import { redirect } from "next/navigation"
 */
export const WORKSPACE = "/labs/14-aem-author-preview/workspace";

export async function GET(request: Request): Promise<Response> {
  void request;
  return todo("implement the draft-mode route handler in draft-route.ts");
}
