import type { WordDifficulty, WordEntry, WordId } from "../types/word";
import { validateWordEntry } from "./answer";

export interface SelectWordOptions {
  difficulty?: WordDifficulty;
  minimumDifficulty?: WordDifficulty;
  maximumDifficulty?: WordDifficulty;
  excludeWordIds?: readonly WordId[];
  randomValue?: number;
}

export function selectWord(
  words: readonly WordEntry[],
  {
    difficulty,
    minimumDifficulty,
    maximumDifficulty,
    excludeWordIds = [],
    randomValue = Math.random(),
  }: SelectWordOptions,
): WordEntry | null {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError("randomValue must be greater than or equal to 0 and less than 1");
  }

  const excluded = new Set(excludeWordIds);
  const candidates = words.filter((word) => {
    validateWordEntry(word);
    return (
      !excluded.has(word.id) &&
      (difficulty === undefined || word.difficulty === difficulty) &&
      (minimumDifficulty === undefined || word.difficulty >= minimumDifficulty) &&
      (maximumDifficulty === undefined || word.difficulty <= maximumDifficulty)
    );
  });

  if (candidates.length === 0) return null;
  return candidates[Math.floor(randomValue * candidates.length)] ?? null;
}
