import { describe, expect, it } from "vitest";

import { GAME_MODES_BY_ID } from "../config/modes";
import { normalizeAnswer, validateWordEntry } from "../engine/answer";
import { WORD_DIFFICULTIES, type WordDifficulty } from "../types/word";
import { buildContentReport, LOCAL_WORD_DATASET, LOCAL_WORDS_BY_GENRE } from "./word-catalog";

describe("local word dataset", () => {
  it("contains the expanded valid regional catalog", () => {
    expect(LOCAL_WORD_DATASET).toHaveLength(680);

    const expectedGenreCounts: Record<string, number> = {
      movies: 80,
      "tv-shows": 72,
      music: 80,
      "video-games": 48,
      sports: 80,
      geography: 80,
      science: 80,
      books: 80,
      "general-knowledge": 80,
    };

    for (const [genre, words] of Object.entries(LOCAL_WORDS_BY_GENRE)) {
      expect(words, genre).toHaveLength(expectedGenreCounts[genre]);
      for (const word of words) {
        expect(() => validateWordEntry(word)).not.toThrow();
        expect(word.region).toMatch(/^(india|usa|global)$/);
        expect(word.hint?.trim()).toBeTruthy();
        expect(word.metadata).toBeDefined();
        expect(word.id).toBe(word.id.trim());
        expect(word.answer).toBe(word.answer.trim());
        expect(word.displayAnswer).toBe(word.displayAnswer.trim());
      }
    }
  });

  it("uses unique stable IDs", () => {
    const ids = LOCAL_WORD_DATASET.map((word) => word.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not contain duplicate normalized answers within a genre", () => {
    const keys = LOCAL_WORD_DATASET.map(
      (word) => `${word.genre}:${normalizeAnswer(word.answer)}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("rejects malformed display text, aliases, hints, and metadata", () => {
    const safeDisplayCharacters = /^[\p{L}\p{N}\s.'’!,:&+\-–/()]+$/u;

    for (const word of LOCAL_WORD_DATASET) {
      expect(word.displayAnswer, word.id).toMatch(safeDisplayCharacters);
      expect(word.hint, word.id).toBe(word.hint?.trim());
      expect(word.alternateAnswers?.every((alias) => alias === alias.trim())).not.toBe(false);
      const normalizedAliases = (word.alternateAnswers ?? []).map(normalizeAnswer);
      expect(new Set(normalizedAliases).size, word.id).toBe(normalizedAliases.length);
      expect(normalizedAliases.includes(normalizeAnswer(word.answer)), word.id).toBe(false);
      expect(
        Object.values(word.metadata ?? {}).every((value) =>
          ["boolean", "number", "string"].includes(typeof value)),
        word.id,
      ).toBe(true);
    }
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

    expect(counts).toEqual({ easy: 166, medium: 242, hard: 175, brutal: 97 });
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

  it("produces a stable region content report", () => {
    const report = buildContentReport(LOCAL_WORD_DATASET);
    expect(report.india).toMatchObject({
      total: 322,
      byDifficulty: { easy: 80, medium: 114, hard: 80, brutal: 48 },
    });
    expect(report.usa).toMatchObject({
      total: 111,
      byDifficulty: { easy: 18, medium: 46, hard: 30, brutal: 17 },
    });
    expect(report.global).toMatchObject({
      total: 247,
      byDifficulty: { easy: 68, medium: 82, hard: 65, brutal: 32 },
    });
    expect(report.india.byGenre).toEqual({
      movies: 40,
      "tv-shows": 32,
      music: 40,
      "video-games": 8,
      sports: 42,
      geography: 40,
      science: 40,
      books: 40,
      "general-knowledge": 40,
    });
  });
});
