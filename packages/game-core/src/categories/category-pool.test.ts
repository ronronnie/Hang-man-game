import { describe, expect, it } from "vitest";

import { CATEGORIES } from "../config/categories";
import { createGameEngine } from "../engine/game-engine";
import type { CategoryDefinition } from "../types/category";
import type { WordEntry } from "../types/word";
import {
  assertValidCategoryConfiguration,
  createCategoryWordPool,
  getEnabledCategories,
} from "./category-pool";

const words = [
  {
    id: "movie",
    answer: "THE DARK KNIGHT",
    displayAnswer: "The Dark Knight",
    genre: "movies",
    difficulty: "easy",
  },
  {
    id: "game",
    answer: "GRAND THEFT AUTO",
    displayAnswer: "Grand Theft Auto",
    genre: "video-games",
    difficulty: "medium",
  },
  {
    id: "team",
    answer: "MANCHESTER UNITED",
    displayAnswer: "Manchester United",
    genre: "sports",
    difficulty: "hard",
  },
] as const satisfies readonly WordEntry[];

describe("category configuration", () => {
  it("defines card-ready metadata for every initial category", () => {
    expect(CATEGORIES).toHaveLength(10);
    expect(CATEGORIES.map((category) => category.name)).toEqual([
      "Movies",
      "TV Shows",
      "Music",
      "Video Games",
      "Sports",
      "Geography",
      "Science",
      "Books",
      "General Knowledge",
      "Surprise Me",
    ]);

    for (const category of CATEGORIES) {
      expect(category.description).not.toBe("");
      expect(category.icon).not.toBe("");
      expect(category.enabled).toBe(true);
    }
  });

  it("validates duplicate IDs and exposes enabled categories", () => {
    expect(getEnabledCategories()).toHaveLength(10);
    expect(() => assertValidCategoryConfiguration([CATEGORIES[0]!, CATEGORIES[0]!])).toThrow(
      'Duplicate category id: "movies"',
    );
  });
});

describe("category word pools", () => {
  it("filters direct categories before creating an engine", () => {
    const pool = createCategoryWordPool(words, "video-games");
    expect(pool.map((word) => word.id)).toEqual(["game"]);

    const engine = createGameEngine({ words: pool, random: () => 0 });
    expect(engine.getState().word.id).toBe("game");
  });

  it("builds Surprise Me from every enabled direct category", () => {
    const pool = createCategoryWordPool(words, "surprise-me");
    expect(pool.map((word) => word.id)).toEqual(["movie", "game", "team"]);

    const engine = createGameEngine({ words: pool, mode: "ultra", random: () => 0.99 });
    expect(engine.getState().word.id).toBe("team");
  });

  it("excludes disabled categories from direct and Surprise Me pools", () => {
    const categories: readonly CategoryDefinition[] = CATEGORIES.map((category) => ({
      ...category,
      enabled: category.id === "sports" ? false : category.enabled,
    }));

    expect(createCategoryWordPool(words, "sports", { categories })).toEqual([]);
    expect(createCategoryWordPool(words, "surprise-me", { categories }).map((word) => word.id)).toEqual([
      "movie",
      "game",
    ]);
  });
});
