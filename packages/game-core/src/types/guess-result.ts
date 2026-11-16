import type { GameEvent, GameState } from "./game-state";

export type GuessKind = "letter" | "word";

export type GuessOutcome =
  | "correct"
  | "incorrect"
  | "already-guessed"
  | "invalid"
  | "round-complete";

export interface GuessResult {
  kind: GuessKind;
  input: string;
  normalizedGuess: string;
  outcome: GuessOutcome;
  /** Null when the guess was not evaluated. */
  correct: boolean | null;
  newlyRevealed: number;
  attemptsConsumed: number;
  previousState: Readonly<GameState>;
  state: Readonly<GameState>;
  events: readonly GameEvent[];
}
