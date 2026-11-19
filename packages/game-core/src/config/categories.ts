import type { CategoryDefinition, CategoryId } from "../types/category";
import { GAME_COPY } from "./copy";

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    id: "movies",
    name: "Movies",
    description: GAME_COPY.categoryDescriptions.movies,
    icon: "film",
    artwork: { source: "category-artwork/movies", alt: "A cinematic film reel and frame" },
    enabled: true,
    selection: "direct",
  },
  {
    id: "tv-shows",
    name: "TV Shows",
    description: GAME_COPY.categoryDescriptions["tv-shows"],
    icon: "television",
    artwork: { source: "category-artwork/tv-shows", alt: "A stylized television screen" },
    enabled: true,
    selection: "direct",
  },
  {
    id: "music",
    name: "Music",
    description: GAME_COPY.categoryDescriptions.music,
    icon: "music-note",
    artwork: { source: "category-artwork/music", alt: "A music note crossing a sound wave" },
    enabled: true,
    selection: "direct",
  },
  {
    id: "video-games",
    name: "Video Games",
    description: GAME_COPY.categoryDescriptions["video-games"],
    icon: "game-controller",
    artwork: { source: "category-artwork/video-games", alt: "A video game controller" },
    enabled: true,
    selection: "direct",
  },
  {
    id: "sports",
    name: "Sports",
    description: GAME_COPY.categoryDescriptions.sports,
    icon: "trophy",
    artwork: { source: "category-artwork/sports", alt: "A championship trophy and field lines" },
    enabled: true,
    selection: "direct",
  },
  {
    id: "geography",
    name: "Geography",
    description: GAME_COPY.categoryDescriptions.geography,
    icon: "globe",
    artwork: { source: "category-artwork/geography", alt: "A globe with latitude and longitude lines" },
    enabled: true,
    selection: "direct",
  },
  {
    id: "science",
    name: "Science",
    description: GAME_COPY.categoryDescriptions.science,
    icon: "flask",
    artwork: { source: "category-artwork/science", alt: "An atom orbiting a laboratory flask" },
    enabled: true,
    selection: "direct",
  },
  {
    id: "books",
    name: "Books",
    description: GAME_COPY.categoryDescriptions.books,
    icon: "book-open",
    artwork: { source: "category-artwork/books", alt: "An open book with turning pages" },
    enabled: true,
    selection: "direct",
  },
  {
    id: "general-knowledge",
    name: "General Knowledge",
    description: GAME_COPY.categoryDescriptions["general-knowledge"],
    icon: "lightbulb",
    artwork: { source: "category-artwork/general-knowledge", alt: "A lightbulb surrounded by ideas" },
    enabled: true,
    selection: "direct",
  },
  {
    id: "surprise-me",
    name: "Surprise Me",
    description: GAME_COPY.categoryDescriptions["surprise-me"],
    icon: "sparkles",
    artwork: { source: "category-artwork/surprise-me", alt: "A wildcard burst of possibilities" },
    enabled: true,
    selection: "surprise",
  },
];

export const CATEGORIES_BY_ID: Readonly<Record<CategoryId, CategoryDefinition>> =
  Object.fromEntries(CATEGORIES.map((category) => [category.id, category])) as unknown as Readonly<
    Record<CategoryId, CategoryDefinition>
  >;
