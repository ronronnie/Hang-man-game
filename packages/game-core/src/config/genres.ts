import type { GenreDefinition, GenreId } from "../types/genre";

export const GENRES = [
  { id: "movies", label: "Movies", description: "Films from every era and genre." },
  { id: "tv-shows", label: "TV Shows", description: "Series, characters, and small-screen favorites." },
  { id: "music", label: "Music", description: "Artists, songs, albums, and music culture." },
  { id: "video-games", label: "Video Games", description: "Games, characters, studios, and virtual worlds." },
  { id: "sports", label: "Sports", description: "Athletes, teams, events, and sporting history." },
  { id: "geography", label: "Geography", description: "Places, landmarks, regions, and the world." },
  { id: "science", label: "Science", description: "Discoveries, fields, people, and natural phenomena." },
  { id: "books", label: "Books", description: "Authors, titles, characters, and literature." },
  { id: "general-knowledge", label: "General Knowledge", description: "A broad mix of facts and culture." },
  {
    id: "surprise-me",
    label: "Surprise Me",
    description: "Let the game choose a category.",
    randomizesGenre: true,
  },
] as const satisfies readonly GenreDefinition[];

export const GENRES_BY_ID: Readonly<Record<GenreId, GenreDefinition>> = Object.fromEntries(
  GENRES.map((genre) => [genre.id, genre]),
) as unknown as Readonly<Record<GenreId, GenreDefinition>>;
