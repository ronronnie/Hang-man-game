import { REGION_PREFERENCES_BY_ID } from "../config/regions";
import type { ContentRegion, RegionPreference } from "../types/region";
import type { WordEntry } from "../types/word";

export function getEligibleContentRegions(
  preference: RegionPreference,
): readonly ContentRegion[] {
  return REGION_PREFERENCES_BY_ID[preference].eligibleRegions;
}

export function filterWordsByRegion(
  words: readonly WordEntry[],
  preference: RegionPreference,
): readonly WordEntry[] {
  const eligible = new Set(getEligibleContentRegions(preference));
  return Object.freeze(words.filter((word) => eligible.has(word.region ?? "global")));
}

export function migrateLegacyWordRegion<T extends Omit<WordEntry, "region"> & { region?: ContentRegion }>(
  word: T,
  fallback: ContentRegion = "global",
): WordEntry {
  return Object.freeze({ ...word, region: word.region ?? fallback });
}
