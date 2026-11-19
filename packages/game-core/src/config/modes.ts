import type { GameModeDefinition, GameModeId } from "../types/mode";
import { MODIFIER_IDS } from "../types/modifier";
import { GAME_COPY } from "./copy";

export const GAME_MODES = [
  {
    id: "i-know-this-game",
    label: "I Know This Game",
    description: GAME_COPY.modeCards["i-know-this-game"].supporting,
    ruleset: "standard",
    rules: {
      maximumIncorrectGuesses: 7,
      timer: null,
      guessedLetterVisibility: "persistent",
      categoryVisibility: "always",
      hints: {
        enabled: true,
        freeHints: 1,
        options: [
          {
            kind: "text-clue",
            label: GAME_COPY.hints.optionLabels.text,
            description: GAME_COPY.hints.optionDescriptions.classicClue,
            cost: { type: "none" },
            requiresConfirmation: false,
          },
          {
            kind: "reveal-letter",
            label: GAME_COPY.hints.optionLabels.reveal,
            description: GAME_COPY.hints.optionDescriptions.classicReveal,
            cost: { type: "none" },
            requiresConfirmation: false,
          },
        ],
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
    description: GAME_COPY.modeCards.ultra.supporting,
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
        options: [
          {
            kind: "text-clue",
            label: GAME_COPY.hints.optionLabels.text,
            description: GAME_COPY.hints.optionDescriptions.ultraClue,
            cost: { type: "score-percent", percent: 10 },
            requiresConfirmation: true,
          },
          {
            kind: "reveal-letter",
            label: GAME_COPY.hints.optionLabels.reveal,
            description: GAME_COPY.hints.optionDescriptions.ultraReveal,
            cost: { type: "score-percent", percent: 20 },
            requiresConfirmation: true,
          },
        ],
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
    description: GAME_COPY.modeCards["ultra-max"].supporting,
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
        options: [
          {
            kind: "show-category",
            label: GAME_COPY.hints.optionLabels.category,
            description: GAME_COPY.hints.optionDescriptions.ultraMaxCategory,
            cost: { type: "time", seconds: 15 },
            requiresConfirmation: true,
          },
          {
            kind: "text-clue",
            label: GAME_COPY.hints.optionLabels.text,
            description: GAME_COPY.hints.optionDescriptions.ultraMaxClue,
            cost: { type: "time", seconds: 10 },
            requiresConfirmation: true,
          },
          {
            kind: "reveal-letter",
            label: GAME_COPY.hints.optionLabels.reveal,
            description: GAME_COPY.hints.optionDescriptions.ultraMaxReveal,
            cost: { type: "attempt", attempts: 1 },
            requiresConfirmation: true,
          },
        ],
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
