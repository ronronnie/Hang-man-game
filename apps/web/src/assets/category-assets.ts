import type { CategoryId } from "@hangman/game-core";

import { placeholderAsset } from "./define-asset";
import type { CategoryAssetConfig } from "./types";

function categoryAsset(
  categoryId: CategoryId,
  accent: string,
  background: string,
  code: string,
): CategoryAssetConfig {
  return {
    categoryId,
    accent,
    background,
    code,
    artwork: placeholderAsset(
      `/assets/categories/${categoryId}.webp`,
      code,
      `${categoryId.replaceAll("-", " ")} category artwork`,
      "cover",
    ),
  };
}

export const CATEGORY_ASSETS = {
  movies: categoryAsset("movies", "#ff7a59", "#17110f", "MOV"),
  "tv-shows": categoryAsset("tv-shows", "#69a7ff", "#0f141c", "TV"),
  music: categoryAsset("music", "#c48cff", "#15101b", "MUS"),
  "video-games": categoryAsset("video-games", "#c6ff4a", "#11160e", "GAME"),
  sports: categoryAsset("sports", "#ffb84d", "#19140c", "SPT"),
  geography: categoryAsset("geography", "#55d8d1", "#0d1718", "GEO"),
  science: categoryAsset("science", "#8e8bff", "#11111b", "SCI"),
  books: categoryAsset("books", "#e0bd79", "#18140f", "BOOK"),
  "general-knowledge": categoryAsset("general-knowledge", "#f2f4e8", "#141616", "GK"),
  "surprise-me": categoryAsset("surprise-me", "#ff6bd6", "#1a0e1a", "???"),
} as const satisfies Readonly<Record<CategoryId, CategoryAssetConfig>>;

export function getCategoryAssets(categoryId: CategoryId): CategoryAssetConfig {
  return CATEGORY_ASSETS[categoryId];
}
