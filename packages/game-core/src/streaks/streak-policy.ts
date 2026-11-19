import type { GameTransition } from "../types/game-state";
import type { StreakState } from "../types/scoring";

export interface StreakPolicy {
  update(current: Readonly<StreakState>, transition: Readonly<GameTransition>): StreakState;
}

export function updateGuessStreak(
  current: Readonly<StreakState>,
  correct: boolean,
): StreakState {
  const nextCurrent = correct ? current.current + 1 : 0;

  return {
    ...current,
    current: nextCurrent,
    best: Math.max(current.best, nextCurrent),
  };
}
