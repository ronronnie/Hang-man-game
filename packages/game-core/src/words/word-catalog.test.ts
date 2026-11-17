import { describe, expect, it } from "vitest";

import { GAME_MODES_BY_ID } from "../config/modes";
import { normalizeAnswer, validateWordEntry } from "../engine/answer";
import { WORD_DIFFICULTIES, type WordDifficulty } from "../types/word";
import { LOCAL_WORD_DATASET, LOCAL_WORDS_BY_GENRE } from "./word-catalog";

describe("local word dataset", () => {
  it("contains 30 valid entries in each playable category", () => {
    expect(LOCAL_WORD_DATASET).toHaveLength(270);

    for (const [genre, words] of Object.entries(LOCAL_WORDS_BY_GENRE)) {
      expect(words, genre).toHaveLength(30);
      for (const word of words) {
        expect(() => validateWordEntry(word)).not.toThrow();
        expect(word.hint?.trim()).toBeTruthy();
        expect(word.metadata).toBeDefined();
      }
    }
  });

  it("uses unique stable IDs", () => {
    const ids = LOCAL_WORD_DATASET.map((word) => word.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has single, multi-word, short, and long answers in every category", () => {
    for (const [genre, words] of Object.entries(LOCAL_WORDS_BY_GENRE)) {
      const lengths = words.map((word) => normalizeAnswer(word.answer).length);
      expect(words.some((word) => !word.displayAnswer.includes(" ")), genre).toBe(true);
      expect(words.some((word) => word.displayAnswer.includes(" ")), genre).toBe(true);
      expect(Math.min(...lengths), genre).toBeLessThanOrEqual(5);
      expect(Math.max(...lengths), genre).toBeGreaterThanOrEqual(20);
    }
  });

  it("closely matches the requested 25/35/25/15 difficulty distribution", () => {
    const counts = Object.fromEntries(
      WORD_DIFFICULTIES.map((difficulty) => [difficulty, 0]),
    ) as Record<WordDifficulty, number>;

    for (const word of LOCAL_WORD_DATASET) counts[word.difficulty] += 1;

    expect(counts).toEqual({ easy: 68, medium: 94, hard: 68, brutal: 40 });
    expect(counts.easy / LOCAL_WORD_DATASET.length).toBeCloseTo(0.25, 1);
    expect(counts.medium / LOCAL_WORD_DATASET.length).toBeCloseTo(0.35, 1);
    expect(counts.hard / LOCAL_WORD_DATASET.length).toBeCloseTo(0.25, 1);
    expect(counts.brutal / LOCAL_WORD_DATASET.length).toBeCloseTo(0.15, 1);
  });

  it("maps modes to progressively more challenging content", () => {
    expect(GAME_MODES_BY_ID["i-know-this-game"].rules.wordPool.difficulties).toEqual([
      "easy",
      "medium",
    ]);
    expect(GAME_MODES_BY_ID.ultra.rules.wordPool.difficulties).toEqual(["medium", "hard"]);
    expect(GAME_MODES_BY_ID["ultra-max"].rules.wordPool.difficulties).toEqual([
      "hard",
      "brutal",
    ]);
  });
});
