import type { GameModeId } from "../types/mode";

export interface ModeRuleset {
  modeId: GameModeId;
  maximumIncorrectGuesses: number;
  initialHintCount: number;
  timed: boolean;
}

// Concrete balancing values will be added alongside the engine implementation.
export type ModeRulesetRegistry = Readonly<Record<GameModeId, ModeRuleset>>;
