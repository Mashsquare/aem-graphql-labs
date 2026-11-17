import { gql, type TypedDocumentNode } from "@apollo/client";
import type { EpisodeData, EpisodeVariables, EpisodesData, EpisodesVariables } from "./types";

/**
 * Task 3 — the documents. Typing them as TypedDocumentNode<Data, Variables> means useQuery()
 * infers `data` and checks `variables` for you — no generics at the call site.
 */

export const EPISODES_QUERY: TypedDocumentNode<EpisodesData, EpisodesVariables> = gql`
  # TODO: query Episodes($page: Int, $filter: FilterEpisode) { episodes(...) { info { ... } results { ... } } }
  query Episodes($page: Int, $filter: FilterEpisode) {
    episodes(page: $page, filter: $filter){
      info {
        count
        pages
        next
        prev
      }
      results {
        id
        name
        episode
        air_date
      } 
    }
  }
`;

export const EPISODE_QUERY: TypedDocumentNode<EpisodeData, EpisodeVariables> = gql`
  # TODO: query Episode($id: ID!) { episode(id: $id) { ... characters { ... } } }
  query Episode($id: ID!) {
    episode(id: $id){
      id
      name
      episode
      air_date
      characters {
        id
        name
        image
        species
      }
    }
  }
`;
