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

export interface GenreDefinition {
  id: GenreId;
  label: string;
  description: string;
  randomizesGenre?: boolean;
}
