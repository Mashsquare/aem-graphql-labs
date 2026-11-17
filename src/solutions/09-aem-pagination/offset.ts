import { aemQuery } from "@/lib/aem/client";
import type { AdventurePageData, OffsetPage } from "@/labs/09-aem-pagination/types";

export const ADVENTURE_PAGE_QUERY = /* GraphQL */ `
  query AdventurePage($offset: Int!, $limit: Int!) {
    adventureList(_locale: "en", sort: "title ASC", offset: $offset, limit: $limit) {
      items {
        _path
        title
        activity
        price
        primaryImage {
          ... on ImageRef {
            _dynamicUrl
          }
        }
      }
    }
  }
`;

export async function getAdventurePage(page: number, pageSize: number): Promise<OffsetPage> {
  const data = await aemQuery<AdventurePageData>(ADVENTURE_PAGE_QUERY, {
    offset: (page - 1) * pageSize,
    // One more than we render: if it exists, there is a next page.
    limit: pageSize + 1,
  });
  const items = data.adventureList.items;
  return { items: items.slice(0, pageSize), page, pageSize, hasNextPage: items.length > pageSize };
}
