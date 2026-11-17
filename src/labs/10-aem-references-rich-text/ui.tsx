/** Provided UI for Lab 10 — article picker + article layout. */
import Link from "next/link";
import type { ComponentType } from "react";
import { EmptyState, JsonPeek, Panel, formatPrice } from "@/components/lab-ui";
import type { RichTextNode } from "@/lib/aem/types";
import { aemImageUrl } from "@/lib/aem/image";
import type { ArticleListItem, ArticleReference, ArticleWithReferences } from "./types";

export interface ArticleApi {
  getArticleList: () => Promise<ArticleListItem[]>;
  getArticle: (slug: string) => Promise<ArticleWithReferences | null>;
  RichText: ComponentType<{ nodes: RichTextNode[]; references: ArticleReference[] }>;
}

export async function ArticleView({ api, slug }: { api: ArticleApi; slug?: string }) {
  const list = await api.getArticleList();
  const selected = slug ?? list[0]?.slug;
  const result = selected ? await api.getArticle(selected) : null;
  const { RichText } = api;

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Panel title="Magazine">
        <ul className="space-y-1 text-sm">
          {list.map((item) => (
            <li key={item._path}>
              <Link href={`?slug=${item.slug}`} className={`block rounded-md px-2 py-1.5 hover:bg-surface-2 ${item.slug === selected ? "bg-accent-soft text-accent" : ""}`}>
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      {result ? (
        <article className="min-w-0 rounded-xl border border-line bg-surface">
          {result.article.featuredImage?._dynamicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={aemImageUrl(result.article.featuredImage._dynamicUrl, { width: 1400 })} alt="" className="aspect-[16/7] w-full rounded-t-xl object-cover" />
          ) : null}
          <div className="p-6">
            <h2 className="text-2xl font-semibold tracking-tight">{result.article.title}</h2>
            <p className="mt-1 text-muted">{result.article.excerpt}</p>
            {result.article.authorFragment ? (
              <div className="mt-4 flex items-center gap-3 text-sm">
                {result.article.authorFragment.profilePicture?._dynamicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={aemImageUrl(result.article.authorFragment.profilePicture._dynamicUrl, { width: 96 })} alt="" className="size-10 rounded-full object-cover" />
                ) : null}
                <span>
                  <span className="font-medium">
                    {result.article.authorFragment.firstName} {result.article.authorFragment.lastName}
                  </span>
                  <span className="block text-muted">
                    {result.article.authorFragment.occupation} · {result.article.readingTimeMinutes} min read
                  </span>
                </span>
              </div>
            ) : null}
            <div className="prose prose-zinc mt-6 max-w-none dark:prose-invert">
              <RichText nodes={result.article.main?.json ?? []} references={result.references} />
            </div>
            {result.article.relatedAdventures.length ? (
              <div className="mt-8 border-t border-line pt-4">
                <h3 className="mb-2 text-sm font-semibold">Related adventures</h3>
                <ul className="flex flex-wrap gap-2 text-sm">
                  {result.article.relatedAdventures.map((adventure) => (
                    <li key={adventure._path} className="rounded-full border border-line px-3 py-1">
                      {adventure.title} · {formatPrice(adventure.price)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <JsonPeek label="main.json (the raw rich text tree)" data={result.article.main?.json} />
            <JsonPeek label="_references" data={result.references} />
          </div>
        </article>
      ) : (
        <EmptyState>No article found.</EmptyState>
      )}
    </div>
  );
}
