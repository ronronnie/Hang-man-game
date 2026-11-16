import type { GameState } from "../types/game-state";
import type { HintDefinition } from "../types/hint";

export interface HintPolicy {
  availableHints(state: Readonly<GameState>): readonly HintDefinition[];
  canUse(state: Readonly<GameState>, hint: HintDefinition): boolean;
}
