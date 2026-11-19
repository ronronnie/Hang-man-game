import type {
  AchievementDefinition,
  AchievementId,
  AchievementProgress,
  AchievementUnlock,
} from "../types/achievement";
import type { CompletedRoundStatistics, PlayerStatistics } from "../types/statistics";

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: "first-blood", title: "FIRST BLOOD", description: "Win your first game.", target: 1 },
  { id: "perfect", title: "PERFECT", description: "Win without a wrong guess.", target: 1 },
  { id: "ultra-instinct", title: "ULTRA INSTINCT", description: "Win an Ultra game.", target: 1 },
  { id: "are-you-human", title: "ARE YOU HUMAN?", description: "Win an Ultra Max game.", target: 1 },
  { id: "clutch", title: "CLUTCH", description: "Win with fewer than 5 seconds remaining.", target: 1 },
  { id: "ten-in-a-row", title: "TEN IN A ROW", description: "Achieve a 10-game win streak.", target: 10 },
] as const;

export const ACHIEVEMENTS_BY_ID = Object.fromEntries(
  ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]),
) as Readonly<Record<AchievementId, AchievementDefinition>>;

export interface AchievementEvaluationResult {
  progress: readonly AchievementProgress[];
  unlocked: readonly AchievementUnlock[];
}

export function evaluateAchievements(
  statistics: Readonly<PlayerStatistics>,
  round: Readonly<CompletedRoundStatistics>,
): AchievementEvaluationResult {
  const previousById = new Map(
    statistics.achievements.map((progress) => [progress.achievementId, progress]),
  );
  const unlocked: AchievementUnlock[] = [];
  const progress = ACHIEVEMENTS.map((definition) => {
    const previous = previousById.get(definition.id);
    const current = getAchievementProgress(definition.id, statistics, round, previous?.current ?? 0);
    const unlockedAt = previous?.unlockedAt ??
      (current >= definition.target ? round.completedAt : undefined);

    if (!previous?.unlockedAt && unlockedAt) {
      unlocked.push({ definition, unlockedAt });
    }

    return {
      achievementId: definition.id,
      current: Math.min(definition.target, current),
      ...(unlockedAt ? { unlockedAt } : {}),
    };
  });

  return { progress, unlocked };
}

function getAchievementProgress(
  achievementId: AchievementId,
  statistics: Readonly<PlayerStatistics>,
  round: Readonly<CompletedRoundStatistics>,
  previousCurrent: number,
): number {
  switch (achievementId) {
    case "first-blood":
      return statistics.overall.gamesWon;
    case "perfect":
      return statistics.overall.perfectGames;
    case "ultra-instinct":
      return statistics.byMode.ultra.gamesWon;
    case "are-you-human":
      return statistics.byMode["ultra-max"].gamesWon;
    case "clutch":
      return previousCurrent +
        (round.outcome === "won" &&
        round.remainingTimeSeconds !== null &&
        round.remainingTimeSeconds < 5
          ? 1
          : 0);
    case "ten-in-a-row":
      return statistics.overall.highestStreak;
  }
}
