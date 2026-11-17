import { aemQuery } from "@/lib/aem/client";
import { todo } from "@/lib/todo";
import type { ArticleListItem, ArticleWithReferences } from "./types";

/** Task 1 — the article picker: English articles, newest first. */
export const ARTICLE_LIST_QUERY = /* GraphQL */ `
  # TODO: query ArticleList { articleList(_locale: "en", sort: "publishDate DESC") { items { _path slug title excerpt } } }
`;

export async function getArticleList(): Promise<ArticleListItem[]> {
  void aemQuery;
  return todo("implement getArticleList() in queries.ts");
}

/**
 * Task 2 — one article by slug, with
 *   - main { json }                                     (rich text as a node tree)
 *   - authorFragment { … profilePicture { … } }          (fragment reference -> AuthorModel)
 *   - relatedAdventures { _path title slug price }       (multi-value fragment reference)
 *   - _references { __typename ... on ImageRef { … } ... on AdventureModel { … } }
 *     (everything the items reference — including images and fragments INSIDE the rich text)
 */
export const ARTICLE_BY_SLUG_QUERY = /* GraphQL */ `
  # TODO: query ArticleBySlug($slug: String!) { articleList(_locale: "en", filter: { slug: ... }) { items { ... } _references { ... } } }
`;

/** Return null when there is no article with that slug. */
export async function getArticle(slug: string): Promise<ArticleWithReferences | null> {
  void slug;
  return todo("implement getArticle() in queries.ts");
}
