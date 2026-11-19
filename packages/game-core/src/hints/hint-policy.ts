import { GAME_MODES_BY_ID } from "../config/modes";
import { isGuessableCharacter, normalizeLetter } from "../engine/answer";
import { getSecondaryWord } from "../modifiers/runtime";
import type { GameState } from "../types/game-state";
import type { HintCost, HintDefinition, HintKind } from "../types/hint";

export interface HintPolicy {
  availableHints(state: Readonly<GameState>): readonly HintDefinition[];
  canUse(state: Readonly<GameState>, hintKind: HintKind): boolean;
}

export function getAvailableHints(state: Readonly<GameState>): readonly HintDefinition[] {
  if (state.status !== "playing") return [];

  const rules = GAME_MODES_BY_ID[state.mode].rules.hints;
  if (!rules.enabled || (rules.freeHints > 0 && state.hints.remaining === 0)) return [];

  return rules.options
    .filter((option) => !state.hints.usages.some((usage) => usage.kind === option.kind))
    .filter((option) => isHintContentAvailable(state, option.kind))
    .map((option) => ({ ...option, id: createHintId(state.word.id, option.kind) }));
}

export function getHintDefinition(
  state: Readonly<GameState>,
  hintKind: HintKind,
): HintDefinition | null {
  return getAvailableHints(state).find((hint) => hint.kind === hintKind) ?? null;
}

export function getRevealableLetters(state: Readonly<GameState>): readonly string[] {
  const secondaryWord = getSecondaryWord(state);
  const answer = `${state.word.displayAnswer}${secondaryWord?.displayAnswer ?? ""}`;
  const guessed = new Set(state.guessedLetters);
  const letters = [...answer]
    .filter(isGuessableCharacter)
    .map(normalizeLetter)
    .filter((letter): letter is string => letter !== null && !guessed.has(letter));

  return [...new Set(letters)];
}

export function createHintId(wordId: string, hintKind: HintKind): string {
  return `${hintKind}:${wordId}`;
}

export function describeHintCost(cost: HintCost): string {
  switch (cost.type) {
    case "none":
      return "Free";
    case "score-percent":
      return `−${cost.percent}% score`;
    case "time":
      return `−${cost.seconds} seconds`;
    case "attempt":
      return `−${cost.attempts} remaining attempt${cost.attempts === 1 ? "" : "s"}`;
  }
}

function isHintContentAvailable(state: Readonly<GameState>, hintKind: HintKind): boolean {
  switch (hintKind) {
    case "text-clue":
      return Boolean(state.word.hint?.trim());
    case "reveal-letter":
      return getRevealableLetters(state).length > 0;
    case "show-category":
      return GAME_MODES_BY_ID[state.mode].rules.categoryVisibility === "pre-round-only";
  }
}
