/** Types for Lab 10 — provided. */
import type { RichTextNode } from "@/lib/aem/types";

export interface ArticleListItem {
  _path: string;
  slug: string;
  title: string;
  excerpt: string | null;
}

export interface ImageReference {
  __typename: "ImageRef";
  _path: string;
  _dynamicUrl: string | null;
  width: number | null;
  height: number | null;
}

export interface AdventureReference {
  __typename: "AdventureModel";
  _path: string;
  title: string;
  slug: string;
}

/** `_references` is a union — types you didn't select fields for only carry __typename. */
export type ArticleReference = ImageReference | AdventureReference | { __typename: "AuthorModel" | "LocationModel" | "ArticleModel" | "DocumentRef" };

export interface Article {
  _path: string;
  title: string;
  excerpt: string | null;
  publishDate: string | null;
  readingTimeMinutes: number | null;
  featuredImage: { _dynamicUrl: string | null; width: number | null; height: number | null } | null;
  main: { json: RichTextNode[] | null } | null;
  authorFragment: {
    firstName: string;
    lastName: string;
    occupation: string | null;
    profilePicture: { _dynamicUrl: string | null } | null;
  } | null;
  relatedAdventures: { _path: string; title: string; slug: string; price: number | null }[];
}

export interface ArticleListData {
  articleList: { items: ArticleListItem[] };
}

export interface ArticleBySlugData {
  articleList: { items: Article[]; _references: ArticleReference[] };
}

export interface ArticleWithReferences {
  article: Article;
  references: ArticleReference[];
}
