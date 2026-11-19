import type { GameState } from "./game-state";
import type { WordEntry, WordId } from "./word";

export const MODIFIER_IDS = [
  "memory",
  "hidden-length",
  "keyboard-amnesia",
  "time-attack",
  "double-trouble",
] as const;

export type ModifierId = (typeof MODIFIER_IDS)[number];

export interface MemoryModifierConfig {
  revealedLetterVisibleSeconds: number;
}

export interface HiddenLengthModifierConfig {
  revealAfterFirstCorrectGuess: boolean;
  placeholderLength: number;
}

export interface KeyboardAmnesiaModifierConfig {
  incorrectKeyUnavailableSeconds: number;
}

export interface TimeAttackModifierConfig {
  timerRateMultiplier: number;
  acceleratedFinalSeconds: number;
}

export interface DoubleTroubleModifierConfig {
  answerCount: 2;
  connectionMetadataKey: string;
  timerBonusSeconds: number;
}

export interface ModifierConfigById {
  memory: MemoryModifierConfig;
  "hidden-length": HiddenLengthModifierConfig;
  "keyboard-amnesia": KeyboardAmnesiaModifierConfig;
  "time-attack": TimeAttackModifierConfig;
  "double-trouble": DoubleTroubleModifierConfig;
}

export type ModifierDefinition = {
  [Id in ModifierId]: {
    id: Id;
    label: string;
    description: string;
    compatibleModes: readonly ["ultra-max"];
    enabled: boolean;
    selectionWeight: number;
    config: Readonly<ModifierConfigById[Id]>;
  };
}[ModifierId];

export type ModifierDefinitionFor<Id extends ModifierId> = Extract<
  ModifierDefinition,
  { id: Id }
>;

export type ModifierDefinitionsById = {
  [Id in ModifierId]: Extract<ModifierDefinition, { id: Id }>;
};

export type ActiveModifier = {
  [Id in ModifierId]: {
    id: Id;
    activatedAtTurn: number;
    config: Readonly<ModifierConfigById[Id]>;
  };
}[ModifierId];

export interface ModifierSelectionConfig {
  count: 1;
  pool: readonly ModifierId[];
}

export interface ModifierPresentation {
  id: ModifierId;
  label: string;
  description: string;
}

export interface TimedLetterReveal {
  letter: string;
  visibleUntilElapsedSeconds: number;
}

export interface TimedIncorrectKey {
  letter: string;
  visibleUntilElapsedSeconds: number;
}

export type ModifierRuntimeState =
  | { id: "memory"; revealedLetters: readonly TimedLetterReveal[] }
  | { id: "hidden-length"; structureRevealed: boolean }
  | { id: "keyboard-amnesia"; visibleIncorrectKeys: readonly TimedIncorrectKey[] }
  | { id: "time-attack"; accelerated: boolean }
  | {
      id: "double-trouble";
      secondaryWord: Readonly<WordEntry>;
      maskedSecondaryAnswer: string;
      solvedWordIds: readonly WordId[];
    };

export type ModifierPredicate = (state: Readonly<GameState>) => boolean;
