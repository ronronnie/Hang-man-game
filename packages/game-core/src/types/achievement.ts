export type AchievementId = string;

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
