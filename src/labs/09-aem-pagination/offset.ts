import { aemQuery } from "@/lib/aem/client";
import { todo } from "@/lib/todo";
import type { AdventurePageData, OffsetPage } from "./types";

/**
 * Part A — offset/limit paging with adventureList.
 *
 * AEM's List results have NO total count and NO "has more" flag. The classic trick: ask for
 * one item more than you show. If it comes back, there is a next page.
 */
export const ADVENTURE_PAGE_QUERY = /* GraphQL */ `
  # TODO: query AdventurePage($offset: Int!, $limit: Int!) {
  #   adventureList(_locale: "en", sort: "title ASC", offset: $offset, limit: $limit) { items { ... } }
  # }
`;

/** page is 1-based. */
export async function getAdventurePage(page: number, pageSize: number): Promise<OffsetPage> {
  // TODO: offset = (page - 1) * pageSize, limit = pageSize + 1; slice the extra item off.
  void aemQuery<AdventurePageData>;
  void page;
  void pageSize;
  return todo("implement getAdventurePage() in offset.ts");
}
