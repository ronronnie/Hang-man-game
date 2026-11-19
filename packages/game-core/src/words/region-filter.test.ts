import { describe, expect, it } from "vitest";

import { createCategoryWordPool } from "../categories/category-pool";
import { GAME_MODES_BY_ID } from "../config/modes";
import { matchesWordAnswer } from "../engine/answer";
import { selectWordWithDifficultyFallback } from "../engine/word-selection";
import { normalizeRegionPreference } from "../types/region";
import type { CategoryId } from "../types/category";
import type { GameModeId } from "../types/mode";
import type { RegionPreference } from "../types/region";
import type { WordEntry } from "../types/word";
import { LOCAL_WORD_DATASET } from "./word-catalog";
import { filterWordsByRegion, migrateLegacyWordRegion } from "./region-filter";

function eligiblePool(
  preference: RegionPreference,
  category: CategoryId,
  mode: GameModeId,
): readonly WordEntry[] {
  const pool = createCategoryWordPool(LOCAL_WORD_DATASET, category, {
    regionPreference: preference,
  });
  return pool.filter((word) =>
    GAME_MODES_BY_ID[mode].rules.wordPool.difficulties.includes(word.difficulty));
}

describe("content region filtering", () => {
  it("maps India to india + global, USA to usa + global, and Mixed to every region", () => {
    const sample = [
      { id: "in", answer: "INDIA", displayAnswer: "India", genre: "geography", region: "india", difficulty: "easy" },
      { id: "us", answer: "AMERICA", displayAnswer: "America", genre: "geography", region: "usa", difficulty: "easy" },
      { id: "world", answer: "EARTH", displayAnswer: "Earth", genre: "geography", region: "global", difficulty: "easy" },
    ] as const satisfies readonly WordEntry[];

    expect(filterWordsByRegion(sample, "india").map(({ id }) => id)).toEqual(["in", "world"]);
    expect(filterWordsByRegion(sample, "usa").map(({ id }) => id)).toEqual(["us", "world"]);
    expect(filterWordsByRegion(sample, "mixed").map(({ id }) => id)).toEqual(["in", "us", "world"]);
  });

  it.each([
    ["india", "movies", "ultra"],
    ["usa", "sports", "i-know-this-game"],
    ["mixed", "science", "ultra-max"],
    ["india", "surprise-me", "ultra"],
    ["usa", "surprise-me", "ultra"],
    ["mixed", "surprise-me", "ultra-max"],
  ] as const)("combines %s + %s + %s filters", (preference, category, mode) => {
    const pool = eligiblePool(preference, category, mode);
    const allowed = preference === "india"
      ? ["india", "global"]
      : preference === "usa"
        ? ["usa", "global"]
        : ["india", "usa", "global"];

    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((word) => allowed.includes(word.region ?? "global"))).toBe(true);
  });

  it("respects recent-answer exclusion", () => {
    const pool = eligiblePool("india", "movies", "ultra");
    const first = selectWordWithDifficultyFallback(pool, { randomValue: 0 });
    const second = selectWordWithDifficultyFallback(pool, {
      excludeWordIds: first ? [first.id] : [],
      randomValue: 0,
    });
    expect(first).not.toBeNull();
    expect(second?.id).not.toBe(first?.id);
  });

  it("widens difficulty but never region, and returns null when no region content exists", () => {
    const hardIndia = [{
      id: "hard-india",
      answer: "HARD",
      displayAnswer: "Hard",
      genre: "books",
      region: "india",
      difficulty: "hard",
    }] as const satisfies readonly WordEntry[];
    expect(selectWordWithDifficultyFallback(hardIndia, {
      difficulties: ["brutal"],
      randomValue: 0,
    })?.id).toBe("hard-india");

    const usaOnly = [{ ...hardIndia[0], id: "usa-only", region: "usa" }] as const;
    expect(filterWordsByRegion(usaOnly, "india")).toEqual([]);
    expect(selectWordWithDifficultyFallback(filterWordsByRegion(usaOnly, "india"), {
      difficulties: ["hard", "brutal"],
      randomValue: 0,
    })).toBeNull();
  });

  it("migrates old regionless content and invalid stored preferences safely", () => {
    const legacy = {
      id: "legacy",
      answer: "LEGACY",
      displayAnswer: "Legacy",
      genre: "general-knowledge" as const,
      difficulty: "easy" as const,
    };
    expect(migrateLegacyWordRegion(legacy).region).toBe("global");
    expect(normalizeRegionPreference("india")).toBe("india");
    expect(normalizeRegionPreference("not-a-region")).toBe("mixed");
  });

  it("normalizes initials and punctuation in full-answer guesses", () => {
    const dhoni = LOCAL_WORD_DATASET.find((word) => word.id === "sports-india-ms-dhoni");
    expect(dhoni).toBeDefined();
    expect(matchesWordAnswer(dhoni!, "M. S. Dhoni")).toBe(true);
    expect(matchesWordAnswer(dhoni!, "MS DHONI")).toBe(true);
  });
});
