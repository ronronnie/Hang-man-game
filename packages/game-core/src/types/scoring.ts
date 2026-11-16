export interface ScoreBreakdown {
  base: number;
  accuracyBonus: number;
  speedBonus: number;
  streakBonus: number;
  hintPenalty: number;
  modifierBonus: number;
  total: number;
}

export interface StreakState {
  current: number;
  best: number;
  lastCompletedDate?: string;
}
