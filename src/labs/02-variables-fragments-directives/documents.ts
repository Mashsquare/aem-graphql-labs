import { typedQuery } from "./client";
import type { CharacterPairData, CharacterPairVariables, CharactersData, CharactersVariables } from "./types";



/* type Character {
  id: ID
  name: String
  status: String      # "Alive" | "Dead" | "unknown"
  species: String
  image: String
  location: Location  # { name }
  origin: Location
  episode: [Episode]  # { id name episode }
} */


/* Task 2 — a reusable selection for a character card */
export const CHARACTER_CARD_FRAGMENT = /* GraphQL */ `
  # TODO: fragment CharacterCard on Character { ... }
  fragment CharacterCard on Character{
    id
    name
    status
    species
    image
    location { name }
    origin { name }
  }
`;

/* Task 3 — paged + filtered characters, episodes only when $withEpisodes is true */
export const CHARACTERS_QUERY = typedQuery<CharactersData, CharactersVariables>(/* GraphQL */ `
  # TODO: query Characters($page: Int, $name: String, $status: String, $withEpisodes: Boolean!) { ... }
  # Hint: interpolate the fragment definition at the end: \${CHARACTER_CARD_FRAGMENT}
  query Characters($page: Int, $name: String, $status: String, $withEpisodes: Boolean!) {
    characters(page: $page, filter: {name: $name, status: $status}) {
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

/* Task 4 — two characters in one request using aliases */
export const CHARACTER_PAIR_QUERY = typedQuery<CharacterPairData, CharacterPairVariables>(/* GraphQL */ `
  # TODO: query CharacterPair($a: ID!, $b: ID!) { first: ... second: ... }
  query CharacterPair($a: ID!, $b: ID!) {
    first: character(id: $a){
      ...CharacterCard
    }
    second: character(id: $b){
      ...CharacterCard
    }
  }
  ${CHARACTER_CARD_FRAGMENT}
`);
