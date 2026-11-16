import type { Genre } from "../types/genre";
import type { WordDifficulty, WordEntry, WordId } from "../types/word";
import { validateWordEntry } from "./answer";

export interface SelectWordOptions {
  genre: Genre;
  difficulty?: WordDifficulty;
  maximumDifficulty?: WordDifficulty;
  excludeWordIds?: readonly WordId[];
  randomValue?: number;
}

export function selectWord(
  words: readonly WordEntry[],
  { genre, difficulty, maximumDifficulty, excludeWordIds = [], randomValue = Math.random() }: SelectWordOptions,
): WordEntry | null {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError("randomValue must be greater than or equal to 0 and less than 1");
  }

  const excluded = new Set(excludeWordIds);
  const candidates = words.filter((word) => {
    validateWordEntry(word);
    return (
      !excluded.has(word.id) &&
      (genre === "surprise-me" || word.genre === genre) &&
      (difficulty === undefined || word.difficulty === difficulty) &&
      (maximumDifficulty === undefined || word.difficulty <= maximumDifficulty)
    );
  });

  if (candidates.length === 0) return null;
  return candidates[Math.floor(randomValue * candidates.length)] ?? null;
}
