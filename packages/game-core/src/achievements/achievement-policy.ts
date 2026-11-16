import type { AchievementProgress } from "../types/achievement";
import type { GameEvent, GameState } from "../types/game-state";

export interface AchievementPolicy {
  evaluate(
    state: Readonly<GameState>,
    events: readonly GameEvent[],
    progress: readonly AchievementProgress[],
  ): readonly AchievementProgress[];
}
