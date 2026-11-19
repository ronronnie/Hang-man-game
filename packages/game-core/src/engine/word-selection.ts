import { WORD_DIFFICULTIES, type WordDifficulty, type WordEntry, type WordId } from "../types/word";
import { validateWordEntry } from "./answer";

export interface SelectWordOptions {
  difficulty?: WordDifficulty;
  difficulties?: readonly WordDifficulty[];
  excludeWordIds?: readonly WordId[];
  randomValue?: number;
}

export interface SelectWordWithFallbackOptions extends SelectWordOptions {
  minimumPreferredPoolSize?: number;
}

export function selectWord(
  words: readonly WordEntry[],
  {
    difficulty,
    difficulties,
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
      (difficulties === undefined || difficulties.includes(word.difficulty))
    );
  });

  if (candidates.length === 0) return null;
  return candidates[Math.floor(randomValue * candidates.length)] ?? null;
}

/**
 * Preserves content/category filters already applied to `words`, widening only
 * difficulty when the preferred mode pool is too small.
 */
export function selectWordWithDifficultyFallback(
  words: readonly WordEntry[],
  options: SelectWordWithFallbackOptions,
): WordEntry | null {
  const preferredDifficulties = options.difficulties ??
    (options.difficulty ? [options.difficulty] : WORD_DIFFICULTIES);
  const excluded = new Set(options.excludeWordIds ?? []);
  const preferredCount = words.filter(
    (word) => !excluded.has(word.id) && preferredDifficulties.includes(word.difficulty),
  ).length;
  const minimum = Math.max(1, options.minimumPreferredPoolSize ?? 3);

  if (preferredCount >= minimum) return selectWord(words, options);

  for (const difficulties of getDifficultyFallbacks(preferredDifficulties)) {
    const selected = selectWord(words, { ...options, difficulty: undefined, difficulties });
    if (selected) return selected;
  }

  return null;
}

function getDifficultyFallbacks(
  preferred: readonly WordDifficulty[],
): readonly (readonly WordDifficulty[])[] {
  const hasEasy = preferred.includes("easy");
  const hasBrutal = preferred.includes("brutal");

  if (hasBrutal && !hasEasy) {
    return [["medium", "hard", "brutal"], WORD_DIFFICULTIES];
  }
  if (hasEasy && !hasBrutal) {
    return [["easy", "medium", "hard"], WORD_DIFFICULTIES];
  }
  return [WORD_DIFFICULTIES];
}
