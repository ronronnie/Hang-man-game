import type { GameState } from "../types/game-state";
import type { ScoreBreakdown } from "../types/scoring";

export interface ScoringPolicy {
  calculate(state: Readonly<GameState>): ScoreBreakdown;
}
