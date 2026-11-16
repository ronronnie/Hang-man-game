import type { PlayableCategoryId } from "./category";
import type { HintState } from "./hint";
import type { GameMode } from "./mode";
import type { ActiveModifier } from "./modifier";
import type { ScoreBreakdown, StreakState } from "./scoring";
import type { GameTimerState } from "./timer";
import type { WordEntry } from "./word";

export type GameStatus = "ready" | "playing" | "paused" | "won" | "lost" | "abandoned";

export interface GameState {
  schemaVersion: 1;
  gameId: string;
  roundId: string;
  roundNumber: number;
  status: GameStatus;
  mode: GameMode;
  /** The selected word's concrete category; Surprise Me is resolved before engine creation. */
  genre: PlayableCategoryId;
  word: Readonly<WordEntry>;
  maskedAnswer: string;
  guessedLetters: readonly string[];
  incorrectLetters: readonly string[];
  remainingAttempts: number;
  maximumAttempts: number;
  timer: Readonly<GameTimerState> | null;
  turn: number;
  hints: HintState;
  modifiers: readonly ActiveModifier[];
  score: ScoreBreakdown;
  streak: StreakState;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type GameAction =
  | { type: "START" }
  | { type: "GUESS_LETTER"; letter: string }
  | { type: "GUESS_ANSWER"; answer: string }
  | { type: "RESET_ROUND" }
  | { type: "START_NEW_ROUND"; wordId: string }
  | { type: "USE_HINT"; hintId: string }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "ABANDON" };

export interface GameTransition {
  previous: Readonly<GameState>;
  current: Readonly<GameState>;
  action: GameAction;
  events: readonly GameEvent[];
}

export type GameEvent =
  | { type: "LETTER_ACCEPTED"; letter: string; correct: boolean }
  | { type: "ANSWER_ACCEPTED"; correct: boolean }
  | { type: "ROUND_RESET"; roundId: string }
  | { type: "ROUND_STARTED"; roundId: string; wordId: string }
  | { type: "TIME_ADVANCED"; elapsedRealSeconds: number; consumedSeconds: number }
  | { type: "TIME_PENALTY_APPLIED"; seconds: number }
  | { type: "MODIFIER_ACTIVATED"; modifierId: ActiveModifier["id"] }
  | { type: "HINT_USED"; hintId: string }
  | { type: "STATUS_CHANGED"; from: GameStatus; to: GameStatus }
  | { type: "SCORE_CHANGED"; difference: number };
