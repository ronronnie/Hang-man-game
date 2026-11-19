import { normalizeRegionPreference, type RegionPreference } from "@hangman/game-core";
import type { StorageAdapter } from "@hangman/shared";

export const REGION_PREFERENCE_STORAGE_KEY = "content-region-preference";
export const DEFAULT_REGION_PREFERENCE: RegionPreference = "mixed";

export async function loadRegionPreference(
  storage: StorageAdapter,
): Promise<RegionPreference> {
  try {
    const value = await storage.get<unknown>(REGION_PREFERENCE_STORAGE_KEY);
    return normalizeRegionPreference(value, DEFAULT_REGION_PREFERENCE);
  } catch {
    return DEFAULT_REGION_PREFERENCE;
  }
}

export async function saveRegionPreference(
  storage: StorageAdapter,
  preference: RegionPreference,
): Promise<void> {
  await storage.set(REGION_PREFERENCE_STORAGE_KEY, preference);
}
