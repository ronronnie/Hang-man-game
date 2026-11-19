import type { ContentRegion, RegionPreference } from "../types/region";

export interface RegionPreferenceDefinition {
  id: RegionPreference;
  label: string;
  supporting: string;
  code: string;
  eligibleRegions: readonly ContentRegion[];
}

export const REGION_PREFERENCE_DEFINITIONS = Object.freeze([
  {
    id: "india",
    label: "India",
    supporting: "Home ground. Global backup.",
    code: "IN",
    eligibleRegions: ["india", "global"],
  },
  {
    id: "usa",
    label: "USA",
    supporting: "Stateside knowledge. World included.",
    code: "US",
    eligibleRegions: ["usa", "global"],
  },
  {
    id: "mixed",
    label: "Mixed",
    supporting: "Everything, everywhere. No excuses.",
    code: "ALL",
    eligibleRegions: ["india", "usa", "global"],
  },
] as const satisfies readonly RegionPreferenceDefinition[]);

export const REGION_PREFERENCES_BY_ID = Object.freeze(
  Object.fromEntries(REGION_PREFERENCE_DEFINITIONS.map((region) => [region.id, region])) as Record<
    RegionPreference,
    (typeof REGION_PREFERENCE_DEFINITIONS)[number]
  >,
);
