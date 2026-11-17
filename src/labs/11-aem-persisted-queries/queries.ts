/**
 * Provided — the queries this lab persists. In a real project these live in your repo, are
 * persisted by CI against Author and promoted via content package / replication.
 */
export const CONFIGURATION = "wknd-shared";

export interface LabPersistedQuery {
  name: string;
  query: string;
  "cache-control"?: { "max-age": number };
  "surrogate-control"?: { "max-age": number; "stale-while-revalidate"?: number; "stale-if-error"?: number };
}

export const LAB_QUERIES: LabPersistedQuery[] = [
  {
    name: "lab-adventures-by-difficulty",
    query: /* GraphQL */ `query LabAdventuresByDifficulty($difficulty: String!) {
  adventureList(
    _locale: "en"
    sort: "price ASC"
    filter: { difficulty: { _expressions: [{ value: $difficulty }] } }
  ) {
    items {
      _path
      title
      slug
      activity
      difficulty
      price
    }
  }
}`,
    // Browsers may cache 2 minutes, the CDN 10 minutes.
    "cache-control": { "max-age": 120 },
    "surrogate-control": { "max-age": 600, "stale-while-revalidate": 86400, "stale-if-error": 86400 },
  },
  {
    name: "lab-adventure-slugs",
    query: /* GraphQL */ `query LabAdventureSlugs {
  adventureList(_locale: "en", sort: "slug ASC") {
    items {
      slug
    }
  }
}`,
  },
];

export interface LabAdventure {
  _path: string;
  title: string;
  slug: string;
  activity: string | null;
  difficulty: string | null;
  price: number | null;
}

export interface LabAdventuresData {
  adventureList: { items: LabAdventure[] };
}
