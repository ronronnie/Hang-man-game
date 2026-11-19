import type { PlayableCategoryId } from "./category";
import type { GameModeId } from "./mode";
import type { AchievementProgress } from "./achievement";
import type { RegionPreference } from "./region";

export interface PlayerStatLine {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  highestScore: number;
  currentStreak: number;
  highestStreak: number;
  perfectGames: number;
  averageAccuracy: number;
  /** Stored to keep average accuracy exact as new rounds are recorded. */
  totalAccuracy: number;
}

export interface PlayerStatistics {
  schemaVersion: 2;
  overall: PlayerStatLine;
  byMode: Readonly<Record<GameModeId, PlayerStatLine>>;
  byGenre: Readonly<Record<PlayableCategoryId, PlayerStatLine>>;
  byRegion: Readonly<Record<RegionPreference, PlayerStatLine>>;
  achievements: readonly AchievementProgress[];
  /** A bounded idempotency ledger for completed rounds. */
  processedRoundIds: readonly string[];
  updatedAt: string;
}

export interface CompletedRoundStatistics {
  roundId: string;
  mode: GameModeId;
  genre: PlayableCategoryId;
  /** Optional only for backwards compatibility with locally queued v1 rounds. */
  regionPreference?: RegionPreference;
  outcome: "won" | "lost";
  score: number;
  accuracyPercent: number;
  wrongGuesses: number;
  remainingTimeSeconds: number | null;
  completedAt: string;
}
