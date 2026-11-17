/** Provided UI for the offset part of Lab 09 (Server Component). */
import Link from "next/link";
import { Badge, Panel, QueryPeek, buttonClass, formatPrice } from "@/components/lab-ui";
import { aemImageUrl } from "@/lib/aem/image";
import type { OffsetPage } from "./types";

export async function OffsetPager({
  getPage,
  page,
  query,
}: {
  getPage: (page: number, pageSize: number) => Promise<OffsetPage>;
  page: number;
  query: string;
}) {
  const result = await getPage(page, 5);
  return (
    <Panel
      title="Part A · offset / limit"
      description={`Page ${result.page} · offset ${(result.page - 1) * result.pageSize}, limit ${result.pageSize + 1} (one extra to detect a next page)`}
    >
      <ol start={(result.page - 1) * result.pageSize + 1} className="mb-4 list-decimal space-y-2 pl-6 text-sm">
        {result.items.map((item) => (
          <li key={item._path}>
            <span className="flex items-center gap-3">
              {item.primaryImage?._dynamicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={aemImageUrl(item.primaryImage._dynamicUrl, { width: 96 })} alt="" className="h-8 w-12 rounded object-cover" />
              ) : null}
              <span className="font-medium">{item.title}</span>
              <Badge>{item.activity}</Badge>
              <span className="text-muted">{formatPrice(item.price)}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        {result.page > 1 ? (
          <Link href={`?page=${result.page - 1}`} className={buttonClass} scroll={false}>
            ← Previous
          </Link>
        ) : null}
        {result.hasNextPage ? (
          <Link href={`?page=${result.page + 1}`} className={buttonClass} scroll={false}>
            Next →
          </Link>
        ) : (
          <span className="self-center text-sm text-muted">last page</span>
        )}
      </div>
      <QueryPeek label="Your ADVENTURE_PAGE_QUERY" query={query} />
    </Panel>
  );
}
