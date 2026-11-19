import {
  beginDailyChallengeAttempt,
  completeDailyChallengeAttempt,
  createEmptyDailyChallengeHistory,
  getDailyChallengeStatus,
  normalizeDailyChallengeHistory,
  type BeginDailyChallengeAttemptResult,
  type CompleteDailyChallengeAttemptResult,
  type DailyChallenge,
  type DailyChallengeHistory,
  type DailyChallengeStatus,
} from "@hangman/game-core";
import type { StorageAdapter } from "@hangman/shared";

export const DAILY_CHALLENGE_STORAGE_KEY = "daily-challenge-history";

export function getLocalCalendarDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function loadDailyChallengeHistory(
  storage: StorageAdapter,
): Promise<Readonly<DailyChallengeHistory>> {
  try {
    return normalizeDailyChallengeHistory(await storage.get<unknown>(DAILY_CHALLENGE_STORAGE_KEY));
  } catch {
    return createEmptyDailyChallengeHistory();
  }
}

export async function loadDailyChallengeStatus(
  storage: StorageAdapter,
  date = getLocalCalendarDate(),
): Promise<DailyChallengeStatus> {
  return getDailyChallengeStatus(await loadDailyChallengeHistory(storage), date);
}

export async function startLocalDailyChallengeAttempt(
  storage: StorageAdapter,
  challenge: Readonly<DailyChallenge>,
  startedAt = new Date().toISOString(),
): Promise<BeginDailyChallengeAttemptResult> {
  const result = beginDailyChallengeAttempt(
    await loadDailyChallengeHistory(storage),
    challenge,
    startedAt,
  );
  if (result.allowed) await storage.set(DAILY_CHALLENGE_STORAGE_KEY, result.history);
  return result;
}

export async function completeLocalDailyChallengeAttempt(
  storage: StorageAdapter,
  challenge: Readonly<DailyChallenge>,
  outcome: "won" | "lost",
  completedAt = new Date().toISOString(),
): Promise<CompleteDailyChallengeAttemptResult> {
  const result = completeDailyChallengeAttempt(
    await loadDailyChallengeHistory(storage),
    challenge,
    outcome,
    completedAt,
  );
  if (result.completed) await storage.set(DAILY_CHALLENGE_STORAGE_KEY, result.history);
  return result;
}
