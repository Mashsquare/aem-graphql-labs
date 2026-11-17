/** Result and variable types for Lab 02 — provided, matching the data shapes in PROMPT.md. */

export interface CharacterCard {
  id: string;
  name: string;
  status: "Alive" | "Dead" | "unknown";
  species: string;
  image: string;
  location: { name: string } | null;
  origin: { name: string } | null;
}

export interface EpisodeSummary {
  id: string;
  name: string;
  episode: string;
}

export interface CharactersData {
  characters: {
    info: { count: number | null; pages: number | null; next: number | null; prev: number | null };
    results: (CharacterCard & { episode?: EpisodeSummary[] })[];
  } | null;
}

export interface CharactersVariables {
  page?: number;
  name?: string;
  status?: string;
  withEpisodes: boolean;
}

export interface CharacterPairData {
  first: CharacterCard | null;
  second: CharacterCard | null;
}

export interface CharacterPairVariables {
  a: string;
  b: string;
}
