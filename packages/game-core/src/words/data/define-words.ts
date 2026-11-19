import type { PlayableCategoryId } from "../../types/category";
import type { WordDifficulty, WordEntry } from "../../types/word";
import type { ContentRegion } from "../../types/region";

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
  regionConfig: {
    defaultRegion?: ContentRegion;
    indiaIds?: readonly string[];
    usaIds?: readonly string[];
  } = {},
): readonly WordEntry[] {
  const indiaIds = new Set(regionConfig.indiaIds ?? []);
  const usaIds = new Set(regionConfig.usaIds ?? []);
  return Object.freeze(
    seeds.map(([id, answer, displayAnswer, difficulty, hint, metadata]) =>
      Object.freeze({
        id: `${genre}-${id}`,
        answer,
        displayAnswer,
        genre,
        region: indiaIds.has(id)
          ? "india"
          : usaIds.has(id)
            ? "usa"
            : (regionConfig.defaultRegion ?? "global"),
        difficulty,
        hint,
        metadata: Object.freeze({ ...baseMetadata, ...metadata }),
      }),
    ),
  );
}
