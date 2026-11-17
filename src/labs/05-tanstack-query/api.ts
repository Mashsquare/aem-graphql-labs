import { ClientError, GraphQLClient, gql } from "graphql-request";
import { todo } from "@/lib/todo";

export const RICK_AND_MORTY_API = "https://rickandmortyapi.com/graphql";

/* -------------------------------------------------------------------------- */
/* Types (provided)                                                            */
/* -------------------------------------------------------------------------- */

export type CharacterStatus = "alive" | "dead" | "unknown";

export interface CharacterFilter {
  status?: CharacterStatus;
}

export interface CharacterTile {
  id: string;
  name: string;
  status: string;
  species: string;
  image: string;
}

export interface CharactersPage {
  info: { count: number; pages: number; next: number | null };
  results: CharacterTile[];
}

/* -------------------------------------------------------------------------- */
/* Task 1 — graphql-request: a client + a document + a fetcher                 */
/* -------------------------------------------------------------------------- */

/** One GraphQLClient instance, reused by every request (headers, URL, fetch options live here). */
export const rickAndMorty = new GraphQLClient(RICK_AND_MORTY_API);

export const CHARACTERS_PAGE_QUERY = gql`
  # TODO: query CharactersPage($page: Int!, $filter: FilterCharacter) { characters(...) { info { count pages next } results { id name status species image } } }
  query CharactersPageTodo {
    __typename
  }
`;

export async function fetchCharactersPage(page: number, filter: CharacterFilter): Promise<CharactersPage> {
  // TODO: const data = await rickAndMorty.request<{ characters: CharactersPage }>(CHARACTERS_PAGE_QUERY, { page, filter });
  //       return data.characters;
  void page;
  void filter;
  return todo("implement fetchCharactersPage() in api.ts");
}

/* -------------------------------------------------------------------------- */
/* Task 2 — query keys and paging                                              */
/* -------------------------------------------------------------------------- */

/**
 * A query key factory: every key for this feature is built here, so invalidation can target
 * "all characters" (characterKeys.all) or one specific list (characterKeys.list(filter)).
 */
export const characterKeys = {
  all: ["rick-and-morty", "characters"] as const,
  list: (filter: CharacterFilter): readonly unknown[] => {
    void filter;
    return todo("characterKeys.list(filter) should return [...characterKeys.all, 'list', filter]");
  },
};

/** Return the next page number, or undefined when there is none (that's how TanStack knows to stop). */
export function getNextPageParam(lastPage: CharactersPage): number | undefined {
  void lastPage;
  return todo("implement getNextPageParam() in api.ts");
}

/* -------------------------------------------------------------------------- */
/* Task 3 — readable errors                                                    */
/* -------------------------------------------------------------------------- */

/** graphql-request throws ClientError for GraphQL errors and non-2xx responses. */
export function describeError(error: unknown): string {
  // TODO: if (error instanceof ClientError) return the GraphQL messages (error.response.errors) joined with "; "
  //       — or `HTTP <status>` when there are none; otherwise fall back to error.message.
  void ClientError;
  return error instanceof Error ? error.message : String(error);
}
