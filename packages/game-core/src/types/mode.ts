import type { HintModeRules } from "./hint";
import type { ModifierSelectionConfig } from "./modifier";
import type { TimerModeRules } from "./timer";
import type { WordDifficulty } from "./word";

export const GAME_MODE_IDS = ["i-know-this-game", "ultra", "ultra-max"] as const;

export type GameModeId = (typeof GAME_MODE_IDS)[number];

/** Public game-domain name. `GameModeId` remains as a backwards-compatible alias. */
export type GameMode = GameModeId;

export type CategoryVisibility = "always" | "pre-round-only";
export type GuessedLetterVisibility = "persistent";
export type WordPoolDifficulty = "normal" | "harder" | "hardest";

export interface WordPoolRules {
  tier: WordPoolDifficulty;
  difficulties: readonly WordDifficulty[];
}

export interface GameModeRules {
  maximumIncorrectGuesses: number;
  timer: Readonly<TimerModeRules> | null;
  guessedLetterVisibility: GuessedLetterVisibility;
  categoryVisibility: CategoryVisibility;
  hints: Readonly<HintModeRules>;
  wordPool: Readonly<WordPoolRules>;
  scoreMultiplier: number;
  supportsPhrases: boolean;
  modifierSelection: Readonly<ModifierSelectionConfig> | null;
}

export interface GameModeDefinition {
  id: GameModeId;
  label: string;
  description: string;
  ruleset: "standard" | "ultra" | "ultra-max";
  rules: Readonly<GameModeRules>;
}
