export const CATEGORY_IDS = [
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

export const PLAYABLE_CATEGORY_IDS = CATEGORY_IDS.filter(
  (categoryId): categoryId is Exclude<(typeof CATEGORY_IDS)[number], "surprise-me"> =>
    categoryId !== "surprise-me",
);

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type PlayableCategoryId = Exclude<CategoryId, "surprise-me">;
export type Category = CategoryId;

/** Semantic icon key. Each client maps this value to its own icon component. */
export type CategoryIcon = string;

export interface CategoryArtwork {
  /** Platform-neutral asset identifier or remote URL resolved by the client. */
  source: string;
  alt: string;
}

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  description: string;
  icon: CategoryIcon;
  artwork?: Readonly<CategoryArtwork>;
  enabled: boolean;
  selection: "direct" | "surprise";
}
