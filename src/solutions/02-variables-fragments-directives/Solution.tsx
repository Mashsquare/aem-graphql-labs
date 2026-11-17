import { param, type LabViewProps } from "@/lib/lab-view";
import { CharactersView } from "@/labs/02-variables-fragments-directives/ui";
import { request } from "./client";
import { CHARACTERS_QUERY, CHARACTER_PAIR_QUERY } from "./documents";

export default function Solution({ searchParams }: LabViewProps) {
  return (
    <CharactersView
      api={{
        searchCharacters: (variables) => request(CHARACTERS_QUERY, variables),
        getPair: (a, b) => request(CHARACTER_PAIR_QUERY, { a, b }),
        charactersQuery: CHARACTERS_QUERY,
        pairQuery: CHARACTER_PAIR_QUERY,
      }}
      params={{
        name: param(searchParams, "name"),
        status: param(searchParams, "status"),
        page: param(searchParams, "page"),
        episodes: param(searchParams, "episodes"),
        a: param(searchParams, "a"),
        b: param(searchParams, "b"),
      }}
    />
  );
}
