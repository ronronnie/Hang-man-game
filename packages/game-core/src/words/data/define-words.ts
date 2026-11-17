import type { PlayableCategoryId } from "../../types/category";
import type { WordDifficulty, WordEntry } from "../../types/word";

export type WordSeed = readonly [
  id: string,
  answer: string,
  displayAnswer: string,
  difficulty: WordDifficulty,
  hint: string,
  metadata?: Readonly<Record<string, boolean | number | string>>,
];

export function defineWords(
  genre: PlayableCategoryId,
  seeds: readonly WordSeed[],
  baseMetadata: Readonly<Record<string, boolean | number | string>>,
): readonly WordEntry[] {
  return Object.freeze(
    seeds.map(([id, answer, displayAnswer, difficulty, hint, metadata]) =>
      Object.freeze({
        id: `${genre}-${id}`,
        answer,
        displayAnswer,
        genre,
        difficulty,
        hint,
        metadata: Object.freeze({ ...baseMetadata, ...metadata }),
      }),
    ),
  );
}
