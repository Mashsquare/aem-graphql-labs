import "server-only";
import { aemConfig } from "@/lib/aem/config";
import {
  ADVENTURES_QUERY,
  ALL_ADVENTURES_QUERY,
  type AemTarget,
  type PreviewAdventure,
} from "@/labs/14-aem-author-preview/types";

export function getAemTarget(preview: boolean): AemTarget {
  const { authorHost, publishHost } = aemConfig();
  if (!preview) return { tier: "publish", host: publishHost, headers: {} };

  const token = process.env.AEM_AUTHOR_TOKEN;
  const basic = Buffer.from(`${process.env.AEM_AUTHOR_USER ?? "admin"}:${process.env.AEM_AUTHOR_PASSWORD ?? "admin"}`).toString("base64");
  return {
    tier: "author",
    host: authorHost,
    headers: { Authorization: token ? `Bearer ${token}` : `Basic ${basic}` },
  };
}

export async function queryTier<TData>(preview: boolean, query: string, variables?: Record<string, unknown>): Promise<TData> {
  const target = getAemTarget(preview);
  const response = await fetch(`${target.host}${aemConfig().endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...target.headers },
    body: JSON.stringify({ query, variables }),
    // Previews must always show the latest Author state.
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`AEM ${target.tier}: HTTP ${response.status}`);
  const body = (await response.json()) as { data?: TData; errors?: { message: string }[] };
  if (body.errors?.length) throw new Error(`AEM ${target.tier}: ${body.errors.map((error) => error.message).join("; ")}`);
  return body.data as TData;
}

export async function getAdventures(preview: boolean): Promise<PreviewAdventure[]> {
  const data = await queryTier<{ adventureList: { items: PreviewAdventure[] } }>(preview, ALL_ADVENTURES_QUERY);
  return data.adventureList.items;
}

export async function getAdventureBySlug(slug: string, preview: boolean): Promise<PreviewAdventure | null> {
  const data = await queryTier<{ adventureList: { items: PreviewAdventure[] } }>(preview, ADVENTURES_QUERY, { slug });
  return data.adventureList.items[0] ?? null;
}
