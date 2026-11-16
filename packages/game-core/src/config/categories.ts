import type { CategoryDefinition, CategoryId } from "../types/category";

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    id: "movies",
    name: "Movies",
    description: "Films from every era and genre.",
    icon: "film",
    enabled: true,
    selection: "direct",
  },
  {
    id: "tv-shows",
    name: "TV Shows",
    description: "Series, characters, and small-screen favorites.",
    icon: "television",
    enabled: true,
    selection: "direct",
  },
  {
    id: "music",
    name: "Music",
    description: "Artists, songs, albums, and music culture.",
    icon: "music-note",
    enabled: true,
    selection: "direct",
  },
  {
    id: "video-games",
    name: "Video Games",
    description: "Games, characters, studios, and virtual worlds.",
    icon: "game-controller",
    enabled: true,
    selection: "direct",
  },
  {
    id: "sports",
    name: "Sports",
    description: "Athletes, teams, events, and sporting history.",
    icon: "trophy",
    enabled: true,
    selection: "direct",
  },
  {
    id: "geography",
    name: "Geography",
    description: "Places, landmarks, regions, and the world.",
    icon: "globe",
    enabled: true,
    selection: "direct",
  },
  {
    id: "science",
    name: "Science",
    description: "Discoveries, fields, people, and natural phenomena.",
    icon: "flask",
    enabled: true,
    selection: "direct",
  },
  {
    id: "books",
    name: "Books",
    description: "Authors, titles, characters, and literature.",
    icon: "book-open",
    enabled: true,
    selection: "direct",
  },
  {
    id: "general-knowledge",
    name: "General Knowledge",
    description: "A broad mix of facts and culture.",
    icon: "lightbulb",
    enabled: true,
    selection: "direct",
  },
  {
    id: "surprise-me",
    name: "Surprise Me",
    description: "Choose from every enabled category.",
    icon: "sparkles",
    enabled: true,
    selection: "surprise",
  },
];

export const CATEGORIES_BY_ID: Readonly<Record<CategoryId, CategoryDefinition>> =
  Object.fromEntries(CATEGORIES.map((category) => [category.id, category])) as unknown as Readonly<
    Record<CategoryId, CategoryDefinition>
  >;
