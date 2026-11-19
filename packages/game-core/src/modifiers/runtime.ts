import type { GameState } from "../types/game-state";
import type {
  ActiveModifier,
  ModifierRuntimeState,
  TimedIncorrectKey,
} from "../types/modifier";
import type { WordEntry } from "../types/word";
import { maskAnswer } from "../engine/answer";
import { getActiveModifier } from "./modifier-selection";

export interface VisibleAnswers {
  primary: string;
  secondary: string | null;
}

export function getVisibleAnswers(state: Readonly<GameState>): VisibleAnswers {
  const runtime = state.modifierState;

  if (runtime?.id === "hidden-length" && !runtime.structureRevealed) {
    const modifier = getActiveModifier(state.modifiers, "hidden-length");
    return {
      primary: "?".repeat(modifier?.config.placeholderLength ?? 11),
      secondary: null,
    };
  }

  if (runtime?.id === "memory" && state.status === "playing") {
    const visibleLetters = runtime.revealedLetters.map((reveal) => reveal.letter);
    return {
      primary: maskAnswer(state.word.displayAnswer, visibleLetters),
      secondary: null,
    };
  }

  if (runtime?.id === "double-trouble") {
    return {
      primary: state.maskedAnswer,
      secondary: runtime.maskedSecondaryAnswer,
    };
  }

  return { primary: state.maskedAnswer, secondary: null };
}

export function getSecondaryWord(state: Readonly<GameState>): Readonly<WordEntry> | null {
  return state.modifierState?.id === "double-trouble"
    ? state.modifierState.secondaryWord
    : null;
}

export function getForgottenIncorrectLetters(state: Readonly<GameState>): readonly string[] {
  if (state.modifierState?.id !== "keyboard-amnesia") return [];
  const visibleIncorrectLetters = new Set(
    state.modifierState.visibleIncorrectKeys.map((entry) => entry.letter),
  );
  return state.incorrectLetters.filter((letter) => !visibleIncorrectLetters.has(letter));
}

export function getVisibleIncorrectLetters(state: Readonly<GameState>): readonly string[] {
  if (state.modifierState?.id !== "keyboard-amnesia") return state.incorrectLetters;
  return state.modifierState.visibleIncorrectKeys.map((entry) => entry.letter);
}

export function createModifierRuntimeState(
  modifiers: readonly ActiveModifier[],
  secondaryWord: Readonly<WordEntry> | null,
): ModifierRuntimeState | null {
  const modifier = modifiers[0];
  if (!modifier) return null;

  switch (modifier.id) {
    case "memory":
      return { id: "memory", revealedLetters: [] };
    case "hidden-length":
      return { id: "hidden-length", structureRevealed: false };
    case "keyboard-amnesia":
      return { id: "keyboard-amnesia", visibleIncorrectKeys: [] };
    case "time-attack":
      return { id: "time-attack", accelerated: false };
    case "double-trouble":
      if (!secondaryWord) {
        throw new Error("Double Trouble requires a secondary WordEntry");
      }
      return {
        id: "double-trouble",
        secondaryWord,
        maskedSecondaryAnswer: maskAnswer(secondaryWord.displayAnswer),
        solvedWordIds: [],
      };
  }
}

export function expireTimedModifierState(
  runtime: Readonly<ModifierRuntimeState> | null,
  elapsedRealSeconds: number,
): ModifierRuntimeState | null {
  if (runtime?.id === "memory") {
    return {
      ...runtime,
      revealedLetters: runtime.revealedLetters.filter(
        (reveal) => reveal.visibleUntilElapsedSeconds > elapsedRealSeconds,
      ),
    };
  }

  if (runtime?.id === "keyboard-amnesia") {
    return {
      ...runtime,
      visibleIncorrectKeys: runtime.visibleIncorrectKeys.filter(
        (entry) => entry.visibleUntilElapsedSeconds > elapsedRealSeconds,
      ),
    };
  }

  return runtime ? { ...runtime } : null;
}

export function addVisibleIncorrectKey(
  entries: readonly TimedIncorrectKey[],
  letter: string,
  visibleUntilElapsedSeconds: number,
): readonly TimedIncorrectKey[] {
  return [
    ...entries.filter((entry) => entry.letter !== letter),
    { letter, visibleUntilElapsedSeconds },
  ];
}
