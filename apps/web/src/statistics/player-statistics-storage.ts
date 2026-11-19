import {
  createEmptyPlayerStatistics,
  normalizePlayerStatistics,
  recordCompletedRound,
  type CompletedRoundStatistics,
  type PlayerStatistics,
  type RecordCompletedRoundResult,
} from "@hangman/game-core";
import type { StorageAdapter } from "@hangman/shared";

export const PLAYER_STATISTICS_STORAGE_KEY = "player-statistics";

export async function loadPlayerStatistics(
  storage: StorageAdapter,
): Promise<Readonly<PlayerStatistics>> {
  try {
    return normalizePlayerStatistics(
      await storage.get<unknown>(PLAYER_STATISTICS_STORAGE_KEY),
    );
  } catch {
    return createEmptyPlayerStatistics();
  }
}

export async function recordLocalCompletedRound(
  storage: StorageAdapter,
  round: Readonly<CompletedRoundStatistics>,
): Promise<RecordCompletedRoundResult> {
  const current = await loadPlayerStatistics(storage);
  const result = recordCompletedRound(current, round);

  if (result.recorded) {
    try {
      await storage.set(PLAYER_STATISTICS_STORAGE_KEY, result.statistics);
    } catch {
      // A blocked storage API should never block the Results transition.
    }
  }

  return result;
}
