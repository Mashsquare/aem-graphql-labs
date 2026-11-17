import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getAdventureBySlug } from "./aem-tier";

export const WORKSPACE = "/labs/14-aem-author-preview/solution/live";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");

  // Only AEM (which knows the shared secret) may switch a browser into preview.
  if (secret !== (process.env.PREVIEW_SECRET ?? "lab-preview-secret")) {
    return new Response("Invalid preview secret", { status: 401 });
  }
  if (!slug) return new Response("Missing slug", { status: 400 });

  // Drafts only exist on Author, so verify there.
  const adventure = await getAdventureBySlug(slug, true);
  if (!adventure) return new Response(`No adventure "${slug}" on AEM Author`, { status: 404 });

  (await draftMode()).enable();
  // Redirect using data from AEM, not the raw query parameter (open-redirect protection).
  redirect(`${WORKSPACE}?slug=${encodeURIComponent(adventure.slug)}`);
}
