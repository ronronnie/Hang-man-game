export const GENRE_IDS = [
  "movies",
  "tv-shows",
  "music",
  "video-games",
  "sports",
  "geography",
  "science",
  "books",
  "general-knowledge",
  "surprise-me",
] as const;

export type GenreId = (typeof GENRE_IDS)[number];

/** Public game-domain name. `GenreId` remains as a backwards-compatible alias. */
export type Genre = GenreId;

export interface GenreDefinition {
  id: GenreId;
  label: string;
  description: string;
  randomizesGenre?: boolean;
}
