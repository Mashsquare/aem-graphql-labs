import { ClientError, GraphQLClient, gql } from "graphql-request";
import type { CharacterFilter, CharactersPage } from "@/labs/05-tanstack-query/api";

export const RICK_AND_MORTY_API = "https://rickandmortyapi.com/graphql";

export const rickAndMorty = new GraphQLClient(RICK_AND_MORTY_API);

export const CHARACTERS_PAGE_QUERY = gql`
  query CharactersPage($page: Int!, $filter: FilterCharacter) {
    characters(page: $page, filter: $filter) {
      info {
        count
        pages
        next
      }
      results {
        id
        name
        status
        species
        image
      }
    }
  }
`;

export async function fetchCharactersPage(page: number, filter: CharacterFilter): Promise<CharactersPage> {
  const data = await rickAndMorty.request<{ characters: CharactersPage }>(CHARACTERS_PAGE_QUERY, { page, filter });
  return data.characters;
}

export const characterKeys = {
  all: ["rick-and-morty", "characters"] as const,
  // The filter object is part of the key: { status: "dead" } and {} are separate cache entries.
  list: (filter: CharacterFilter) => [...characterKeys.all, "list", filter] as const,
};

export function getNextPageParam(lastPage: CharactersPage): number | undefined {
  // The API returns next: null on the last page; TanStack stops when it gets undefined.
  return lastPage.info.next ?? undefined;
}

export function describeError(error: unknown): string {
  if (error instanceof ClientError) {
    const messages = error.response.errors?.map((item) => item.message) ?? [];
    return messages.length ? messages.join("; ") : `HTTP ${error.response.status}`;
  }
  return error instanceof Error ? error.message : String(error);
}
