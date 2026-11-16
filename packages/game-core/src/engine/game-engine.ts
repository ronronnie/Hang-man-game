import type { GameEvent, GameState, GameStatus } from "../types/game-state";
import type { Genre } from "../types/genre";
import type { GuessKind, GuessOutcome, GuessResult } from "../types/guess-result";
import type { GameMode } from "../types/mode";
import type { WordDifficulty, WordEntry, WordId } from "../types/word";
import {
  countOccurrences,
  isAnswerComplete,
  maskAnswer,
  matchesWordAnswer,
  normalizeAnswer,
  normalizeLetter,
  validateWordEntry,
} from "./answer";
import { selectWord } from "./word-selection";

export const DEFAULT_MAXIMUM_ATTEMPTS = 6;

export interface GameEngineConfig {
  words: readonly WordEntry[];
  gameId?: string;
  mode?: GameMode;
  genre?: Genre;
  difficulty?: WordDifficulty;
  maximumAttempts?: number;
  random?: () => number;
  now?: () => string;
  createRoundId?: (roundNumber: number) => string;
}

export interface StartNewRoundOptions {
  genre?: Genre;
  difficulty?: WordDifficulty;
  maximumAttempts?: number;
  excludeWordIds?: readonly WordId[];
}

export interface GameEngine {
  getState(): Readonly<GameState>;
  guessLetter(letter: string): GuessResult;
  solveWord(answer: string): GuessResult;
  resetRound(): Readonly<GameState>;
  startNewRound(options?: StartNewRoundOptions): Readonly<GameState>;
}

export class HangmanGameEngine implements GameEngine {
  private readonly words: readonly WordEntry[];
  private readonly random: () => number;
  private readonly now: () => string;
  private readonly createRoundId: (roundNumber: number) => string;
  private readonly gameId: string;
  private readonly mode: GameMode;
  private genre: Genre;
  private difficulty?: WordDifficulty;
  private maximumAttempts: number;
  private state!: Readonly<GameState>;

  constructor(config: GameEngineConfig) {
    if (config.words.length === 0) throw new Error("GameEngine requires at least one WordEntry");

    config.words.forEach(validateWordEntry);
    assertUniqueWordIds(config.words);
    this.words = Object.freeze(config.words.map(freezeWord));
    this.random = config.random ?? Math.random;
    this.now = config.now ?? (() => new Date().toISOString());
    this.createRoundId = config.createRoundId ?? ((roundNumber) => `round-${Date.now()}-${roundNumber}`);
    this.gameId = config.gameId ?? `game-${Date.now()}`;
    this.mode = config.mode ?? "i-know-this-game";
    this.genre = config.genre ?? "surprise-me";
    this.difficulty = config.difficulty;
    this.maximumAttempts = assertMaximumAttempts(config.maximumAttempts ?? DEFAULT_MAXIMUM_ATTEMPTS);
    this.startNewRound();
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  guessLetter(input: string): GuessResult {
    const previousState = this.state;
    const normalizedLetter = normalizeLetter(input);

    if (previousState.status !== "playing") {
      return this.unchangedResult("letter", input, normalizedLetter ?? "", "round-complete");
    }

    if (!normalizedLetter) return this.unchangedResult("letter", input, "", "invalid");
    if (previousState.guessedLetters.includes(normalizedLetter)) {
      return this.unchangedResult("letter", input, normalizedLetter, "already-guessed");
    }

    const occurrences = countOccurrences(previousState.word.displayAnswer, normalizedLetter);
    const correct = occurrences > 0;
    const guessedLetters = Object.freeze([...previousState.guessedLetters, normalizedLetter]);
    const incorrectLetters = correct
      ? previousState.incorrectLetters
      : Object.freeze([...previousState.incorrectLetters, normalizedLetter]);
    const remainingAttempts = Math.max(0, previousState.remainingAttempts - (correct ? 0 : 1));
    const status = resolveStatus(
      isAnswerComplete(previousState.word.displayAnswer, guessedLetters),
      remainingAttempts,
    );
    const updatedAt = this.now();
    const events: GameEvent[] = [{ type: "LETTER_ACCEPTED", letter: normalizedLetter, correct }];
    appendStatusEvent(events, previousState.status, status);

    this.state = freezeState({
      ...previousState,
      status,
      maskedAnswer: maskAnswer(previousState.word.displayAnswer, guessedLetters),
      guessedLetters,
      incorrectLetters,
      remainingAttempts,
      turn: previousState.turn + 1,
      updatedAt,
      completedAt: isTerminal(status) ? updatedAt : undefined,
    });

    return buildGuessResult({
      kind: "letter",
      input,
      normalizedGuess: normalizedLetter,
      outcome: correct ? "correct" : "incorrect",
      correct,
      newlyRevealed: correct ? occurrences : 0,
      attemptsConsumed: correct ? 0 : 1,
      previousState,
      state: this.state,
      events,
    });
  }

  solveWord(input: string): GuessResult {
    const previousState = this.state;
    const normalizedGuess = normalizeAnswer(input);

    if (previousState.status !== "playing") {
      return this.unchangedResult("word", input, normalizedGuess, "round-complete");
    }

    if (!normalizedGuess) return this.unchangedResult("word", input, "", "invalid");

    const correct = matchesWordAnswer(previousState.word, input);
    const remainingAttempts = Math.max(0, previousState.remainingAttempts - (correct ? 0 : 1));
    const status: GameStatus = correct ? "won" : remainingAttempts === 0 ? "lost" : "playing";
    const updatedAt = this.now();
    const events: GameEvent[] = [{ type: "ANSWER_ACCEPTED", correct }];
    appendStatusEvent(events, previousState.status, status);

    this.state = freezeState({
      ...previousState,
      status,
      maskedAnswer: correct ? previousState.word.displayAnswer : previousState.maskedAnswer,
      remainingAttempts,
      turn: previousState.turn + 1,
      updatedAt,
      completedAt: isTerminal(status) ? updatedAt : undefined,
    });

    return buildGuessResult({
      kind: "word",
      input,
      normalizedGuess,
      outcome: correct ? "correct" : "incorrect",
      correct,
      newlyRevealed: correct ? [...previousState.maskedAnswer].filter((character) => character === "_").length : 0,
      attemptsConsumed: correct ? 0 : 1,
      previousState,
      state: this.state,
      events,
    });
  }

  resetRound(): Readonly<GameState> {
    this.state = createRoundState({
      gameId: this.gameId,
      roundId: this.state.roundId,
      roundNumber: this.state.roundNumber,
      word: this.state.word,
      mode: this.mode,
      genre: this.genre,
      maximumAttempts: this.maximumAttempts,
      timestamp: this.now(),
    });
    return this.state;
  }

  startNewRound(options: StartNewRoundOptions = {}): Readonly<GameState> {
    this.genre = options.genre ?? this.genre;
    this.difficulty = options.difficulty ?? this.difficulty;
    this.maximumAttempts = assertMaximumAttempts(options.maximumAttempts ?? this.maximumAttempts);

    const currentWordId = this.state?.word.id;
    const requestedExclusions = options.excludeWordIds ?? (currentWordId ? [currentWordId] : []);
    const selectionOptions = {
      genre: this.genre,
      difficulty: this.difficulty,
      excludeWordIds: requestedExclusions,
      randomValue: this.random(),
    } as const;
    const word =
      selectWord(this.words, selectionOptions) ??
      selectWord(this.words, { ...selectionOptions, excludeWordIds: [], randomValue: this.random() });

    if (!word) {
      throw new Error(`No words are available for genre "${this.genre}" and the requested difficulty`);
    }

    const roundNumber = (this.state?.roundNumber ?? 0) + 1;
    this.state = createRoundState({
      gameId: this.gameId,
      roundId: this.createRoundId(roundNumber),
      roundNumber,
      word,
      mode: this.mode,
      genre: this.genre,
      maximumAttempts: this.maximumAttempts,
      timestamp: this.now(),
    });
    return this.state;
  }

  private unchangedResult(
    kind: GuessKind,
    input: string,
    normalizedGuess: string,
    outcome: GuessOutcome,
  ): GuessResult {
    return buildGuessResult({
      kind,
      input,
      normalizedGuess,
      outcome,
      correct: null,
      newlyRevealed: 0,
      attemptsConsumed: 0,
      previousState: this.state,
      state: this.state,
      events: [],
    });
  }
}

export function createGameEngine(config: GameEngineConfig): GameEngine {
  return new HangmanGameEngine(config);
}

interface CreateRoundStateOptions {
  gameId: string;
  roundId: string;
  roundNumber: number;
  word: WordEntry;
  mode: GameMode;
  genre: Genre;
  maximumAttempts: number;
  timestamp: string;
}

function createRoundState(options: CreateRoundStateOptions): Readonly<GameState> {
  return freezeState({
    schemaVersion: 1,
    gameId: options.gameId,
    roundId: options.roundId,
    roundNumber: options.roundNumber,
    status: "playing",
    mode: options.mode,
    genre: options.genre,
    word: options.word,
    maskedAnswer: maskAnswer(options.word.displayAnswer),
    guessedLetters: [],
    incorrectLetters: [],
    remainingAttempts: options.maximumAttempts,
    maximumAttempts: options.maximumAttempts,
    turn: 0,
    hints: { usedHintIds: [], remaining: options.word.hint ? 1 : 0 },
    modifiers: [],
    score: emptyScore(),
    streak: { current: 0, best: 0 },
    startedAt: options.timestamp,
    updatedAt: options.timestamp,
  });
}

function freezeState(state: GameState): Readonly<GameState> {
  return Object.freeze({
    ...state,
    word: freezeWord(state.word),
    guessedLetters: Object.freeze([...state.guessedLetters]),
    incorrectLetters: Object.freeze([...state.incorrectLetters]),
    modifiers: Object.freeze([...state.modifiers]),
    hints: Object.freeze({ ...state.hints, usedHintIds: Object.freeze([...state.hints.usedHintIds]) }),
    score: Object.freeze({ ...state.score }),
    streak: Object.freeze({ ...state.streak }),
  });
}

function freezeWord(word: WordEntry): Readonly<WordEntry> {
  return Object.freeze({
    ...word,
    alternateAnswers: word.alternateAnswers ? Object.freeze([...word.alternateAnswers]) : undefined,
    metadata: word.metadata ? Object.freeze({ ...word.metadata }) : undefined,
  });
}

function assertUniqueWordIds(words: readonly WordEntry[]): void {
  const ids = new Set<string>();

  words.forEach((word) => {
    if (ids.has(word.id)) throw new Error(`Duplicate WordEntry id: "${word.id}"`);
    ids.add(word.id);
  });
}

function emptyScore() {
  return {
    base: 0,
    accuracyBonus: 0,
    speedBonus: 0,
    streakBonus: 0,
    hintPenalty: 0,
    modifierBonus: 0,
    total: 0,
  };
}

function assertMaximumAttempts(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError("maximumAttempts must be a positive integer");
  }
  return value;
}

function resolveStatus(answerComplete: boolean, remainingAttempts: number): GameStatus {
  if (answerComplete) return "won";
  if (remainingAttempts === 0) return "lost";
  return "playing";
}

function isTerminal(status: GameStatus): boolean {
  return status === "won" || status === "lost";
}

function appendStatusEvent(events: GameEvent[], previous: GameStatus, current: GameStatus): void {
  if (previous !== current) events.push({ type: "STATUS_CHANGED", from: previous, to: current });
}

function buildGuessResult(result: GuessResult): GuessResult {
  return Object.freeze({ ...result, events: Object.freeze([...result.events]) });
}
