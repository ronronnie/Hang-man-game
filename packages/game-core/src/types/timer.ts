import type { GameEvent, GameState } from "./game-state";

export interface TimerModeRules {
  durationSeconds: number;
  incorrectGuessPenaltySeconds: number;
  rateMultiplier: number;
}

export interface GameTimerState extends TimerModeRules {
  remainingSeconds: number;
  elapsedRealSeconds: number;
}

export interface TimeAdvanceResult {
  elapsedRealSeconds: number;
  consumedSeconds: number;
  previousState: Readonly<GameState>;
  state: Readonly<GameState>;
  events: readonly GameEvent[];
}
