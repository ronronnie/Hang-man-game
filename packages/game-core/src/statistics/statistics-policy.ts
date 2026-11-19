import { GAME_MODE_IDS, type GameModeId } from "../types/mode";
import { ACHIEVEMENT_IDS } from "../types/achievement";
import {
  CATEGORY_IDS,
  type PlayableCategoryId,
} from "../types/category";
import type {
  CompletedRoundStatistics,
  PlayerStatistics,
  PlayerStatLine,
} from "../types/statistics";
import { evaluateAchievements } from "../achievements/achievement-policy";
import type { AchievementUnlock } from "../types/achievement";
import { REGION_PREFERENCES, type RegionPreference } from "../types/region";

const PROCESSED_ROUND_LIMIT = 100;
const PLAYABLE_CATEGORY_IDS = CATEGORY_IDS.filter(
  (categoryId): categoryId is PlayableCategoryId => categoryId !== "surprise-me",
);

export interface RecordCompletedRoundResult {
  statistics: Readonly<PlayerStatistics>;
  unlockedAchievements: readonly AchievementUnlock[];
  recorded: boolean;
}

export function createEmptyPlayerStatistics(now = new Date().toISOString()): PlayerStatistics {
  return {
    schemaVersion: 2,
    overall: createEmptyStatLine(),
    byMode: Object.fromEntries(
      GAME_MODE_IDS.map((modeId) => [modeId, createEmptyStatLine()]),
    ) as Record<GameModeId, PlayerStatLine>,
    byGenre: Object.fromEntries(
      PLAYABLE_CATEGORY_IDS.map((genreId) => [genreId, createEmptyStatLine()]),
    ) as Record<PlayableCategoryId, PlayerStatLine>,
    byRegion: Object.fromEntries(
      REGION_PREFERENCES.map((region) => [region, createEmptyStatLine()]),
    ) as Record<RegionPreference, PlayerStatLine>,
    achievements: [],
    processedRoundIds: [],
    updatedAt: now,
  };
}

export function recordCompletedRound(
  current: Readonly<PlayerStatistics>,
  round: Readonly<CompletedRoundStatistics>,
): RecordCompletedRoundResult {
  if (current.processedRoundIds.includes(round.roundId)) {
    return { statistics: current, unlockedAchievements: [], recorded: false };
  }

  const won = round.outcome === "won";
  const perfect = won && round.wrongGuesses === 0;
  const regionPreference = round.regionPreference ?? "mixed";
  const nextBase: PlayerStatistics = {
    ...current,
    overall: updateStatLine(current.overall, round, won, perfect),
    byMode: {
      ...current.byMode,
      [round.mode]: updateStatLine(current.byMode[round.mode], round, won, perfect),
    },
    byGenre: {
      ...current.byGenre,
      [round.genre]: updateStatLine(current.byGenre[round.genre], round, won, perfect),
    },
    byRegion: {
      ...current.byRegion,
      [regionPreference]: updateStatLine(current.byRegion[regionPreference], round, won, perfect),
    },
    processedRoundIds: [...current.processedRoundIds, round.roundId].slice(-PROCESSED_ROUND_LIMIT),
    updatedAt: round.completedAt,
  };
  const achievementResult = evaluateAchievements(nextBase, round);
  const statistics = {
    ...nextBase,
    achievements: achievementResult.progress,
  };

  return {
    statistics,
    unlockedAchievements: achievementResult.unlocked,
    recorded: true,
  };
}

export function normalizePlayerStatistics(value: unknown): PlayerStatistics {
  const empty = createEmptyPlayerStatistics();
  if (!isRecord(value) || (value.schemaVersion !== 1 && value.schemaVersion !== 2)) return empty;

  return {
    ...empty,
    overall: normalizeStatLine(value.overall),
    byMode: Object.fromEntries(
      GAME_MODE_IDS.map((modeId) => [
        modeId,
        normalizeStatLine(isRecord(value.byMode) ? value.byMode[modeId] : null),
      ]),
    ) as Record<GameModeId, PlayerStatLine>,
    byGenre: Object.fromEntries(
      PLAYABLE_CATEGORY_IDS.map((genreId) => [
        genreId,
        normalizeStatLine(isRecord(value.byGenre) ? value.byGenre[genreId] : null),
      ]),
    ) as Record<PlayableCategoryId, PlayerStatLine>,
    byRegion: Object.fromEntries(
      REGION_PREFERENCES.map((region) => [
        region,
        normalizeStatLine(isRecord(value.byRegion) ? value.byRegion[region] : null),
      ]),
    ) as Record<RegionPreference, PlayerStatLine>,
    achievements: Array.isArray(value.achievements)
      ? value.achievements.filter(isAchievementProgress)
      : [],
    processedRoundIds: Array.isArray(value.processedRoundIds)
      ? value.processedRoundIds.filter((id): id is string => typeof id === "string").slice(-PROCESSED_ROUND_LIMIT)
      : [],
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : empty.updatedAt,
  };
}

function createEmptyStatLine(): PlayerStatLine {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    highestScore: 0,
    currentStreak: 0,
    highestStreak: 0,
    perfectGames: 0,
    averageAccuracy: 0,
    totalAccuracy: 0,
  };
}

function updateStatLine(
  current: Readonly<PlayerStatLine>,
  round: Readonly<CompletedRoundStatistics>,
  won: boolean,
  perfect: boolean,
): PlayerStatLine {
  const gamesPlayed = current.gamesPlayed + 1;
  const gamesWon = current.gamesWon + (won ? 1 : 0);
  const currentStreak = won ? current.currentStreak + 1 : 0;
  const totalAccuracy = current.totalAccuracy + clamp(round.accuracyPercent, 0, 100);

  return {
    gamesPlayed,
    gamesWon,
    winRate: roundToOneDecimal((gamesWon / gamesPlayed) * 100),
    highestScore: Math.max(current.highestScore, Math.max(0, round.score)),
    currentStreak,
    highestStreak: Math.max(current.highestStreak, currentStreak),
    perfectGames: current.perfectGames + (perfect ? 1 : 0),
    averageAccuracy: roundToOneDecimal(totalAccuracy / gamesPlayed),
    totalAccuracy,
  };
}

function normalizeStatLine(value: unknown): PlayerStatLine {
  const empty = createEmptyStatLine();
  if (!isRecord(value)) return empty;

  return Object.fromEntries(
    Object.keys(empty).map((key) => {
      const candidate = value[key];
      return [key, typeof candidate === "number" && Number.isFinite(candidate) ? Math.max(0, candidate) : 0];
    }),
  ) as unknown as PlayerStatLine;
}

function isAchievementProgress(value: unknown): value is PlayerStatistics["achievements"][number] {
  return (
    isRecord(value) &&
    typeof value.achievementId === "string" &&
    ACHIEVEMENT_IDS.some((achievementId) => achievementId === value.achievementId) &&
    typeof value.current === "number" &&
    (value.unlockedAt === undefined || typeof value.unlockedAt === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
