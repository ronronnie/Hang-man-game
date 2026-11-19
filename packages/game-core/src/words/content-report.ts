import { PLAYABLE_CATEGORY_IDS, type PlayableCategoryId } from "../types/category";
import { CONTENT_REGIONS, type ContentRegion } from "../types/region";
import { WORD_DIFFICULTIES, type WordDifficulty, type WordEntry } from "../types/word";

export interface ContentRegionReport {
  total: number;
  byGenre: Readonly<Record<PlayableCategoryId, number>>;
  byDifficulty: Readonly<Record<WordDifficulty, number>>;
}

export function buildContentReport(
  words: readonly WordEntry[],
): Readonly<Record<ContentRegion, Readonly<ContentRegionReport>>> {
  const report = Object.fromEntries(CONTENT_REGIONS.map((region) => [region, {
    total: 0,
    byGenre: Object.fromEntries(PLAYABLE_CATEGORY_IDS.map((genre) => [genre, 0])),
    byDifficulty: Object.fromEntries(WORD_DIFFICULTIES.map((difficulty) => [difficulty, 0])),
  }])) as Record<ContentRegion, {
    total: number;
    byGenre: Record<PlayableCategoryId, number>;
    byDifficulty: Record<WordDifficulty, number>;
  }>;

  for (const word of words) {
    const region = word.region ?? "global";
    report[region].total += 1;
    report[region].byGenre[word.genre] += 1;
    report[region].byDifficulty[word.difficulty] += 1;
  }

  return Object.freeze(report);
}
