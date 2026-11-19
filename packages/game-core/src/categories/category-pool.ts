import { CATEGORIES } from "../config/categories";
import type {
  CategoryDefinition,
  CategoryId,
  PlayableCategoryId,
} from "../types/category";
import type { WordEntry } from "../types/word";
import type { RegionPreference } from "../types/region";
import { filterWordsByRegion } from "../words/region-filter";

export interface CreateCategoryWordPoolOptions {
  categories?: readonly CategoryDefinition[];
  regionPreference?: RegionPreference;
}

/**
 * Resolves a player-facing category selection into the platform-independent word
 * pool supplied to the game engine. The engine remains unaware of categories.
 */
export function createCategoryWordPool(
  words: readonly WordEntry[],
  categoryId: CategoryId,
  options: CreateCategoryWordPoolOptions = {},
): readonly WordEntry[] {
  const categories = options.categories ?? CATEGORIES;
  assertValidCategoryConfiguration(categories);

  const selectedCategory = categories.find((category) => category.id === categoryId);
  if (!selectedCategory) throw new Error(`Unknown category: "${categoryId}"`);
  if (!selectedCategory.enabled) return Object.freeze([]);

  const enabledCategoryIds = new Set<PlayableCategoryId>(
    categories
      .filter(isEnabledDirectCategory)
      .map((category) => category.id as PlayableCategoryId),
  );

  const categoryPool = words.filter((word) =>
    selectedCategory.selection === "surprise"
      ? enabledCategoryIds.has(word.genre)
      : word.genre === selectedCategory.id,
  );
  const pool = filterWordsByRegion(categoryPool, options.regionPreference ?? "mixed");

  return Object.freeze([...pool]);
}

export function getEnabledCategories(
  categories: readonly CategoryDefinition[] = CATEGORIES,
): readonly CategoryDefinition[] {
  assertValidCategoryConfiguration(categories);
  return Object.freeze(categories.filter((category) => category.enabled));
}

export function assertValidCategoryConfiguration(
  categories: readonly CategoryDefinition[],
): void {
  const ids = new Set<CategoryId>();
  let surpriseCategoryCount = 0;

  for (const category of categories) {
    if (ids.has(category.id)) throw new Error(`Duplicate category id: "${category.id}"`);
    ids.add(category.id);

    if (!category.name.trim()) throw new Error(`Category "${category.id}" requires a name`);
    if (!category.description.trim()) {
      throw new Error(`Category "${category.id}" requires a description`);
    }
    if (!category.icon.trim()) throw new Error(`Category "${category.id}" requires an icon`);
    if (category.selection === "surprise") surpriseCategoryCount += 1;
  }

  if (surpriseCategoryCount > 1) {
    throw new Error("Category configuration can contain at most one surprise category");
  }
}

function isEnabledDirectCategory(category: CategoryDefinition): boolean {
  return category.enabled && category.selection === "direct";
}
