import type { GameModeDefinition, GameModeId } from "../types/mode";
import { MODIFIER_IDS } from "../types/modifier";

export const GAME_MODES = [
  {
    id: "i-know-this-game",
    label: "I Know This Game",
    description: "The familiar word-guessing experience.",
    ruleset: "standard",
    rules: {
      maximumIncorrectGuesses: 7,
      timer: null,
      guessedLetterVisibility: "persistent",
      categoryVisibility: "always",
      hints: {
        enabled: true,
        freeHints: 1,
        reducesFinalScore: false,
        costOptions: ["none"],
      },
      wordPool: { tier: "normal", difficulties: ["easy", "medium"] },
      scoreMultiplier: 1,
      supportsPhrases: true,
      modifierSelection: null,
    },
  },
  {
    id: "ultra",
    label: "Ultra",
    description: "An expanded ruleset for a more dynamic challenge.",
    ruleset: "ultra",
    rules: {
      maximumIncorrectGuesses: 5,
      timer: {
        durationSeconds: 60,
        incorrectGuessPenaltySeconds: 5,
        rateMultiplier: 1,
      },
      guessedLetterVisibility: "persistent",
      categoryVisibility: "always",
      hints: {
        enabled: true,
        freeHints: 0,
        reducesFinalScore: true,
        costOptions: ["score"],
      },
      wordPool: { tier: "harder", difficulties: ["medium", "hard"] },
      scoreMultiplier: 2,
      supportsPhrases: true,
      modifierSelection: null,
    },
  },
  {
    id: "ultra-max",
    label: "Ultra Max",
    description: "The most demanding mode, with additional modifiers.",
    ruleset: "ultra-max",
    rules: {
      maximumIncorrectGuesses: 4,
      timer: {
        durationSeconds: 45,
        incorrectGuessPenaltySeconds: 7,
        rateMultiplier: 1,
      },
      guessedLetterVisibility: "persistent",
      categoryVisibility: "pre-round-only",
      hints: {
        enabled: true,
        freeHints: 0,
        reducesFinalScore: true,
        costOptions: ["time", "score"],
      },
      wordPool: { tier: "hardest", difficulties: ["hard", "brutal"] },
      scoreMultiplier: 4,
      supportsPhrases: true,
      modifierSelection: { count: 1, pool: MODIFIER_IDS },
    },
  },
] as const satisfies readonly GameModeDefinition[];

export const GAME_MODES_BY_ID: Readonly<Record<GameModeId, GameModeDefinition>> = Object.fromEntries(
  GAME_MODES.map((mode) => [mode.id, mode]),
) as unknown as Readonly<Record<GameModeId, GameModeDefinition>>;
