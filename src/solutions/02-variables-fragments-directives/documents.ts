import { typedQuery } from "./client";
import type {
  CharacterPairData,
  CharacterPairVariables,
  CharactersData,
  CharactersVariables,
} from "@/labs/02-variables-fragments-directives/types";

export const CHARACTER_CARD_FRAGMENT = /* GraphQL */ `
  fragment CharacterCard on Character {
    id
    name
    status
    species
    image
    location {
      name
    }
    origin {
      name
    }
  }
`;

export const CHARACTERS_QUERY = typedQuery<CharactersData, CharactersVariables>(/* GraphQL */ `
  query Characters($page: Int, $name: String, $status: String, $withEpisodes: Boolean!) {
    characters(page: $page, filter: { name: $name, status: $status }) {
      info {
        count
        pages
        next
        prev
      }
      results {
        ...CharacterCard
        episode @include(if: $withEpisodes) {
          id
          name
          episode
        }
      }
    }
  }
  ${CHARACTER_CARD_FRAGMENT}
`);

export const CHARACTER_PAIR_QUERY = typedQuery<CharacterPairData, CharacterPairVariables>(/* GraphQL */ `
  query CharacterPair($a: ID!, $b: ID!) {
    first: character(id: $a) {
      ...CharacterCard
    }
    second: character(id: $b) {
      ...CharacterCard
    }
  }
  ${CHARACTER_CARD_FRAGMENT}
`);
