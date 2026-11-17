import type { PersistedQuery } from "../types";

/**
 * Persisted queries that ship "pre-installed" (and already replicated to Publish), like the ones
 * the WKND reference site deploys via a content package under
 * /conf/wknd-shared/settings/graphql/persistentQueries.
 */
const seed = (
  name: string,
  query: string,
  extra: Pick<PersistedQuery, "cacheControl" | "surrogateControl"> = {},
): PersistedQuery => ({
  configurationName: "wknd-shared",
  name,
  query: query.trim(),
  published: true,
  created: "2026-06-01T09:00:00.000Z",
  lastModified: "2026-06-01T09:00:00.000Z",
  origin: "seed",
  ...extra,
});

export const seedPersistedQueries: PersistedQuery[] = [
  seed(
    "adventures-all",
    /* GraphQL */ `
query AdventuresAll($locale: String = "en") {
  adventureList(_locale: $locale, sort: "title ASC") {
    items {
      _path
      title
      slug
      activity
      adventureType
      price
      tripLength
      groupSize
      difficulty
      primaryImage {
        ... on ImageRef {
          _path
          _dynamicUrl
          mimeType
          width
          height
        }
      }
      description {
        plaintext
      }
    }
  }
}`,
  ),
  seed(
    "adventure-by-slug",
    /* GraphQL */ `
query AdventureBySlug($slug: String!, $variation: String, $locale: String = "en") {
  adventureList(
    _locale: $locale
    variation: $variation
    filter: { slug: { _expressions: [{ value: $slug }] } }
  ) {
    items {
      _path
      _variation
      title
      slug
      description {
        json
        html
      }
      adventureType
      tripLength
      activity
      groupSize
      difficulty
      price
      departureDate
      primaryImage {
        ... on ImageRef {
          _path
          _dynamicUrl
          mimeType
          width
          height
        }
      }
      location {
        name
        city
        country
        region
        coordinates
      }
      itinerary {
        json
        html
      }
      gearList {
        json
        html
      }
    }
    _references {
      ... on ImageRef {
        _path
        _dynamicUrl
      }
    }
  }
}`,
    {
      // Equivalent to persisting with { "cache-control": {...}, "surrogate-control": {...} } in the request body.
      cacheControl: { "max-age": 300 },
      surrogateControl: { "max-age": 3600, "stale-while-revalidate": 86400, "stale-if-error": 86400 },
    },
  ),
  seed(
    "adventures-by-activity",
    /* GraphQL */ `
query AdventuresByActivity($activity: String!, $locale: String = "en") {
  adventureList(
    _locale: $locale
    sort: "price ASC"
    filter: { activity: { _expressions: [{ value: $activity }] } }
  ) {
    items {
      _path
      title
      slug
      activity
      difficulty
      price
      primaryImage {
        ... on ImageRef {
          _dynamicUrl
        }
      }
    }
  }
}`,
  ),
  seed(
    "articles-all",
    /* GraphQL */ `
query ArticlesAll($locale: String = "en") {
  articleList(_locale: $locale, sort: "publishDate DESC") {
    items {
      _path
      title
      slug
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
      authorFragment {
        firstName
        lastName
      }
    }
  }
}`,
  ),
  seed(
    "article-by-slug",
    /* GraphQL */ `
query ArticleBySlug($slug: String!, $variation: String, $locale: String = "en") {
  articleList(
    _locale: $locale
    variation: $variation
    filter: { slug: { _expressions: [{ value: $slug }] } }
  ) {
    items {
      _path
      _variation
      title
      slug
      excerpt
      publishDate
      readingTimeMinutes
      main {
        json
      }
      featuredImage {
        ... on ImageRef {
          _dynamicUrl
          width
          height
        }
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
}`,
  ),
];
