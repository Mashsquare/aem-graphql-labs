/** Result and variable types for Lab 03 — provided. */

export interface EpisodeSummary {
  __typename?: "Episode";
  id: string;
  name: string;
  episode: string;
  air_date: string;
}

export interface EpisodesPage {
  __typename?: "Episodes";
  info: { count: number | null; pages: number | null; next: number | null; prev: number | null };
  results: EpisodeSummary[];
}

export interface EpisodesData {
  episodes: EpisodesPage | null;
}

export interface EpisodesVariables {
  page?: number;
  filter?: { name?: string; episode?: string };
}

export interface EpisodeDetail extends EpisodeSummary {
  characters: { __typename?: "Character"; id: string; name: string; image: string; species: string }[];
}

export interface EpisodeData {
  episode: EpisodeDetail | null;
}

export interface EpisodeVariables {
  id: string;
}
