import { GAME_MODES_BY_ID } from "../config/modes";
import { countGuessableCharacters, normalizeLetter } from "../engine/answer";
import { getSecondaryWord } from "../modifiers/runtime";
import type { GameState } from "../types/game-state";
import type { ScoreBreakdown } from "../types/scoring";
import type { WordDifficulty } from "../types/word";
import { getUltraComboMultiplier } from "../ultra/ultra-policy";

export const STARTING_BASE_SCORE = 400;
export const POINTS_PER_CHARACTER = 35;

export const DIFFICULTY_MULTIPLIERS: Readonly<Record<WordDifficulty, number>> = {
  easy: 1,
  medium: 1.25,
  hard: 1.6,
  brutal: 2,
};

export interface ScoringPolicy {
  calculate(state: Readonly<GameState>): ScoreBreakdown;
}

export function calculateScore(state: Readonly<GameState>): ScoreBreakdown {
  const modeRules = GAME_MODES_BY_ID[state.mode].rules;
  const wordLength = getRoundAnswerLength(state);
  const wordLengthBonus = wordLength * POINTS_PER_CHARACTER;
  const baseScore = STARTING_BASE_SCORE + wordLengthBonus;
  const progressMultiplier = getProgressMultiplier(state, wordLength);
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[state.word.difficulty];
  const modeMultiplier = modeRules.scoreMultiplier;
  const remainingTimeMultiplier = getRemainingTimeMultiplier(state);
  const totalDecisions = state.metrics.correctGuesses + state.metrics.incorrectGuesses;
  const accuracyPercent =
    totalDecisions === 0 ? 100 : (state.metrics.correctGuesses / totalDecisions) * 100;
  const accuracyMultiplier = 0.6 + (accuracyPercent / 100) * 0.4;
  const comboMultiplier = getUltraComboMultiplier(state.streak.best);
  const scoreBeforeTime = Math.round(
    baseScore *
      progressMultiplier *
      difficultyMultiplier *
      modeMultiplier *
      accuracyMultiplier *
      comboMultiplier,
  );
  const multipliedScore = Math.round(scoreBeforeTime * remainingTimeMultiplier);
  const timeBonus = Math.max(0, multipliedScore - scoreBeforeTime);

  const won = state.status === "won";
  const earlySolve = won && state.metrics.solvedByFullWord && state.metrics.solvedEntireWordEarly;
  const perfectSolve =
    won && state.metrics.incorrectGuesses === 0 && state.hints.usages.length === 0;
  const clutch =
    won &&
    (state.remainingAttempts === 1 ||
      (state.timer !== null && state.timer.remainingSeconds < 5));
  const earlySolveBonus = earlySolve
    ? Math.round(300 * difficultyMultiplier * modeMultiplier)
    : 0;
  const perfectSolveBonus = perfectSolve
    ? Math.round(500 * difficultyMultiplier * modeMultiplier)
    : 0;
  const clutchBonus = clutch ? 400 * modeMultiplier : 0;
  const modifierBonus = won ? state.modifiers.length * 250 * modeMultiplier : 0;
  const hintPenaltyPercent = Math.min(
    100,
    state.hints.usages.reduce(
      (total, usage) =>
        usage.cost.type === "score-percent" ? total + usage.cost.percent : total,
      0,
    ),
  );
  const grossScore =
    multipliedScore + earlySolveBonus + perfectSolveBonus + clutchBonus + modifierBonus;
  const hintPenalty = Math.round(grossScore * (hintPenaltyPercent / 100));
  const total = Math.max(0, grossScore - hintPenalty);
  const hintedLetters = new Set(
    state.hints.usages
      .map((usage) => usage.revealedLetter)
      .filter((letter): letter is string => Boolean(letter)),
  );
  const lettersGuessed = state.guessedLetters.filter((letter) => !hintedLetters.has(letter)).length;
  const remainingLetters =
    state.status === "won" ? 0 : Math.max(0, wordLength - getRevealedCharacterCount(state));

  return {
    baseScore,
    startingBaseScore: STARTING_BASE_SCORE,
    wordLength,
    wordLengthBonus,
    progressMultiplier: roundMultiplier(progressMultiplier),
    difficultyMultiplier,
    modeMultiplier,
    remainingTimeSeconds: state.timer ? Math.max(0, state.timer.remainingSeconds) : null,
    remainingTimeMultiplier: roundMultiplier(remainingTimeMultiplier),
    accuracyPercent: Math.round(accuracyPercent),
    accuracyMultiplier: roundMultiplier(accuracyMultiplier),
    comboMultiplier,
    timeBonus,
    multipliedScore,
    lettersGuessed,
    remainingLetters,
    wrongGuesses: state.metrics.incorrectGuesses,
    hintsUsed: state.hints.usages.length,
    hintPenaltyPercent,
    hintPenalty,
    earlySolve,
    earlySolveBonus,
    perfectSolve,
    perfectSolveBonus,
    clutch,
    clutchBonus,
    modifierBonus,
    total,
  };
}

export function parseScoreBreakdown(value: string): ScoreBreakdown | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Record<string, unknown>;
    const numericKeys: readonly (keyof ScoreBreakdown)[] = [
      "baseScore",
      "startingBaseScore",
      "wordLength",
      "wordLengthBonus",
      "progressMultiplier",
      "difficultyMultiplier",
      "modeMultiplier",
      "remainingTimeMultiplier",
      "accuracyPercent",
      "accuracyMultiplier",
      "comboMultiplier",
      "timeBonus",
      "multipliedScore",
      "lettersGuessed",
      "remainingLetters",
      "wrongGuesses",
      "hintsUsed",
      "hintPenaltyPercent",
      "hintPenalty",
      "earlySolveBonus",
      "perfectSolveBonus",
      "clutchBonus",
      "modifierBonus",
      "total",
    ];
    const booleanKeys: readonly (keyof ScoreBreakdown)[] = [
      "earlySolve",
      "perfectSolve",
      "clutch",
    ];

    if (
      numericKeys.some(
        (key) => typeof candidate[key] !== "number" || !Number.isFinite(candidate[key]),
      )
    ) {
      return null;
    }
    if (booleanKeys.some((key) => typeof candidate[key] !== "boolean")) return null;
    if (
      candidate.remainingTimeSeconds !== null &&
      (typeof candidate.remainingTimeSeconds !== "number" ||
        !Number.isFinite(candidate.remainingTimeSeconds))
    ) {
      return null;
    }

    return parsed as ScoreBreakdown;
  } catch {
    return null;
  }
}

function getRoundAnswerLength(state: Readonly<GameState>): number {
  const secondaryWord = getSecondaryWord(state);
  return (
    countGuessableCharacters(state.word.displayAnswer) +
    (secondaryWord ? countGuessableCharacters(secondaryWord.displayAnswer) : 0)
  );
}

function getProgressMultiplier(state: Readonly<GameState>, wordLength: number): number {
  if (state.status === "won") return 1;
  if (wordLength === 0) return 0;

  return Math.min(1, getRevealedCharacterCount(state) / wordLength);
}

function getRevealedCharacterCount(state: Readonly<GameState>): number {
  const guessed = new Set(state.guessedLetters.map(normalizeLetter).filter(Boolean));
  const secondaryWord = getSecondaryWord(state);
  const solvedWordIds =
    state.modifierState?.id === "double-trouble"
      ? new Set(state.modifierState.solvedWordIds)
      : new Set<string>();
  return [state.word, ...(secondaryWord ? [secondaryWord] : [])].reduce(
    (total, word) =>
      total +
      [...word.displayAnswer].filter((character) => {
        const letter = normalizeLetter(character);
        return letter !== null && (guessed.has(letter) || solvedWordIds.has(word.id));
      }).length,
    0,
  );
}

function getRemainingTimeMultiplier(state: Readonly<GameState>): number {
  if (!state.timer) return 1;
  const remainingRatio = Math.max(
    0,
    Math.min(1, state.timer.remainingSeconds / state.timer.durationSeconds),
  );
  return 1 + remainingRatio * 0.5;
}

function roundMultiplier(value: number): number {
  return Math.round(value * 100) / 100;
}
