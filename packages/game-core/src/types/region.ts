export const CONTENT_REGIONS = ["india", "usa", "global"] as const;
export type ContentRegion = (typeof CONTENT_REGIONS)[number];

export const REGION_PREFERENCES = ["india", "usa", "mixed"] as const;
export type RegionPreference = (typeof REGION_PREFERENCES)[number];

export function isContentRegion(value: string): value is ContentRegion {
  return CONTENT_REGIONS.some((region) => region === value);
}

export function isRegionPreference(value: string): value is RegionPreference {
  return REGION_PREFERENCES.some((region) => region === value);
}

export function normalizeRegionPreference(
  value: unknown,
  fallback: RegionPreference = "mixed",
): RegionPreference {
  return typeof value === "string" && isRegionPreference(value) ? value : fallback;
}
