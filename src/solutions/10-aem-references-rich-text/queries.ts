import { aemQuery } from "@/lib/aem/client";
import type {
  ArticleBySlugData,
  ArticleListData,
  ArticleListItem,
  ArticleWithReferences,
} from "@/labs/10-aem-references-rich-text/types";

export const ARTICLE_LIST_QUERY = /* GraphQL */ `
  query ArticleList {
    articleList(_locale: "en", sort: "publishDate DESC") {
      items {
        _path
        slug
        title
        excerpt
      }
    }
  }
`;

export async function getArticleList(): Promise<ArticleListItem[]> {
  return (await aemQuery<ArticleListData>(ARTICLE_LIST_QUERY)).articleList.items;
}

export const ARTICLE_BY_SLUG_QUERY = /* GraphQL */ `
  query ArticleBySlug($slug: String!) {
    articleList(_locale: "en", filter: { slug: { _expressions: [{ value: $slug }] } }) {
      items {
        _path
        title
        excerpt
        publishDate
        readingTimeMinutes
        featuredImage {
          ... on ImageRef {
            _dynamicUrl
            width
            height
          }
        }
        main {
          json
        }
        authorFragment {
          firstName
          lastName
          occupation
          profilePicture {
            ... on ImageRef {
              _dynamicUrl
            }
          }
        }
        relatedAdventures {
          _path
          title
          slug
          price
        }
      }
      _references {
        __typename
        ... on ImageRef {
          _path
          _dynamicUrl
          width
          height
        }
        ... on AdventureModel {
          _path
          title
          slug
        }
      }
    }
  }
`;

export async function getArticle(slug: string): Promise<ArticleWithReferences | null> {
  const data = await aemQuery<ArticleBySlugData>(ARTICLE_BY_SLUG_QUERY, { slug });
  // Slugs are unique per language, but a List query still returns an array.
  const article = data.articleList.items[0];
  return article ? { article, references: data.articleList._references } : null;
}
