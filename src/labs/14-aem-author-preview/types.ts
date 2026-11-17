/** Types for Lab 14 — provided. */
export interface PreviewAdventure {
  _path: string;
  title: string;
  slug: string;
  price: number | null;
  description: { plaintext: string | null } | null;
}

export interface AemTarget {
  tier: "author" | "publish";
  host: string;
  /** Extra request headers — Authorization for Author, nothing for Publish. */
  headers: Record<string, string>;
}

const ADVENTURE_FIELDS = /* GraphQL */ `
  _path
  title
  slug
  price
  description {
    plaintext
  }
`;

export const ADVENTURES_QUERY = /* GraphQL */ `
  query PreviewAdventureBySlug($slug: String!) {
    adventureList(_locale: "en", filter: { slug: { _expressions: [{ value: $slug }] } }) {
      items { ${ADVENTURE_FIELDS} }
    }
  }
`;

export const ALL_ADVENTURES_QUERY = /* GraphQL */ `
  query PreviewAdventures {
    adventureList(_locale: "en", sort: "title ASC") {
      items { ${ADVENTURE_FIELDS} }
    }
  }
`;
