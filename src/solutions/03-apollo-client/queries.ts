import { gql, type TypedDocumentNode } from "@apollo/client";
import type { EpisodeData, EpisodeVariables, EpisodesData, EpisodesVariables } from "@/labs/03-apollo-client/types";

export const EPISODES_QUERY: TypedDocumentNode<EpisodesData, EpisodesVariables> = gql`
  query Episodes($page: Int, $filter: FilterEpisode) {
    episodes(page: $page, filter: $filter) {
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
  query Episode($id: ID!) {
    episode(id: $id) {
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
