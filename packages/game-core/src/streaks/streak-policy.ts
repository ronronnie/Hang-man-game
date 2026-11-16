import type { GameTransition } from "../types/game-state";
import type { StreakState } from "../types/scoring";

export interface StreakPolicy {
  update(current: Readonly<StreakState>, transition: Readonly<GameTransition>): StreakState;
}
