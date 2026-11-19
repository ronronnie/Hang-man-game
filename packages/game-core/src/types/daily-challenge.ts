import type { PlayableCategoryId } from "./category";
import type { GameModeId } from "./mode";
import type { ModifierId } from "./modifier";
import type { WordEntry, WordId } from "./word";
import type { RegionPreference } from "./region";

export type DailyChallengeStatus = "not-attempted" | "won" | "lost";

export interface DailyChallenge {
  id: string;
  date: string;
  contentVersion: string;
  seed: number;
  genreId: PlayableCategoryId;
  regionPreference: RegionPreference;
  wordId: WordId;
  answer: string;
  displayAnswer: string;
  /** The complete deterministic answer set. Double Trouble contains two entries. */
  words: readonly Readonly<WordEntry>[];
  modeId: GameModeId;
  modifierId: ModifierId | null;
}

export interface DailyChallengeGenerator {
  generate(date: string): DailyChallenge;
}

export interface DailyChallengeAttempt {
  challengeId: string;
  date: string;
  /** Set at the start so reloading cannot grant another official attempt. */
  attempted: boolean;
  status: DailyChallengeStatus;
  startedAt: string | null;
  completedAt: string | null;
}

export interface DailyChallengeHistory {
  schemaVersion: 1;
  attemptsByDate: Readonly<Record<string, Readonly<DailyChallengeAttempt>>>;
}

export interface BeginDailyChallengeAttemptResult {
  allowed: boolean;
  history: Readonly<DailyChallengeHistory>;
  attempt: Readonly<DailyChallengeAttempt>;
  reason: "already-attempted" | null;
}

export interface CompleteDailyChallengeAttemptResult {
  completed: boolean;
  history: Readonly<DailyChallengeHistory>;
  attempt: Readonly<DailyChallengeAttempt> | null;
  reason: "attempt-not-started" | "already-completed" | null;
}
