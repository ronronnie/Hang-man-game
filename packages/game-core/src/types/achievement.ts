export const ACHIEVEMENT_IDS = [
  "first-blood",
  "perfect",
  "ultra-instinct",
  "are-you-human",
  "clutch",
  "ten-in-a-row",
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  target: number;
  hidden?: boolean;
}

export interface AchievementProgress {
  achievementId: AchievementId;
  current: number;
  unlockedAt?: string;
}

export interface AchievementUnlock {
  definition: Readonly<AchievementDefinition>;
  unlockedAt: string;
}
