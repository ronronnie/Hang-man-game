import type { GameEvent, GameState, GameStatus } from "../types/game-state";
import type { GuessKind, GuessOutcome, GuessResult } from "../types/guess-result";
import type { HintCost, HintDefinition, HintKind } from "../types/hint";
import type { ActiveModifier, ModifierRuntimeState } from "../types/modifier";
import type { GameMode, GameModeRules } from "../types/mode";
import type { StreakState } from "../types/scoring";
import type { GameTimerState, TimeAdvanceResult, TimerModeRules } from "../types/timer";
import type { WordDifficulty, WordEntry, WordId } from "../types/word";
import { GAME_MODES_BY_ID } from "../config/modes";
import {
  getAvailableHints as getAvailableHintDefinitions,
  getHintDefinition,
  getRevealableLetters,
} from "../hints/hint-policy";
import { getActiveModifier, selectRoundModifier } from "../modifiers/modifier-selection";
import {
  addVisibleIncorrectKey,
  createModifierRuntimeState,
  expireTimedModifierState,
  getSecondaryWord,
} from "../modifiers/runtime";
import { ULTRA_MAX_MODIFIERS } from "../modifiers/registry";
import { calculateScore } from "../scoring/scoring-policy";
import { updateGuessStreak } from "../streaks/streak-policy";
import { getUltraComboMultiplier } from "../ultra/ultra-policy";
import {
  countOccurrences,
  countGuessableCharacters,
  isAnswerComplete,
  maskAnswer,
  matchesWordAnswer,
  normalizeAnswer,
  normalizeLetter,
  validateWordEntry,
} from "./answer";
import { selectWord } from "./word-selection";

export interface GameEngineConfig {
  words: readonly WordEntry[];
  gameId?: string;
  mode?: GameMode;
  difficulty?: WordDifficulty;
  maximumAttempts?: number;
  random?: () => number;
  now?: () => string;
  createRoundId?: (roundNumber: number) => string;
  initialWordId?: WordId;
}

export interface StartNewRoundOptions {
  difficulty?: WordDifficulty;
  maximumAttempts?: number;
  excludeWordIds?: readonly WordId[];
}

export interface UseHintResult {
  outcome: "revealed" | "unavailable" | "round-complete";
  hintId: string | null;
  hintKind: HintKind | null;
  text: string | null;
  revealedLetter: string | null;
  cost: HintCost | null;
  previousState: Readonly<GameState>;
  state: Readonly<GameState>;
  events: readonly GameEvent[];
}

export interface GameEngine {
  getState(): Readonly<GameState>;
  getAvailableHints(): readonly HintDefinition[];
  restoreRound(state: Readonly<GameState>): Readonly<GameState>;
  beginRound(): Readonly<GameState>;
  guessLetter(letter: string): GuessResult;
  solveWord(answer: string): GuessResult;
  useHint(hintKind?: HintKind): UseHintResult;
  advanceTime(elapsedRealSeconds: number): TimeAdvanceResult;
  resetRound(): Readonly<GameState>;
  startNewRound(options?: StartNewRoundOptions): Readonly<GameState>;
}

export class HangmanGameEngine implements GameEngine {
  private readonly words: readonly WordEntry[];
  private readonly random: () => number;
  private readonly now: () => string;
  private readonly createRoundId: (roundNumber: number) => string;
  private readonly gameId: string;
  private readonly initialWordId?: WordId;
  private readonly mode: GameMode;
  private readonly modeRules: Readonly<GameModeRules>;
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
    this.initialWordId = config.initialWordId;
    this.mode = config.mode ?? "i-know-this-game";
    this.modeRules = GAME_MODES_BY_ID[this.mode].rules;
    this.difficulty = config.difficulty;
    this.maximumAttempts = assertMaximumAttempts(
      config.maximumAttempts ?? this.modeRules.maximumIncorrectGuesses,
    );
    this.startNewRound();
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  getAvailableHints(): readonly HintDefinition[] {
    return getAvailableHintDefinitions(this.state);
  }

  restoreRound(snapshot: Readonly<GameState>): Readonly<GameState> {
    if (snapshot.schemaVersion !== 1) {
      throw new Error("Unsupported GameState schema version");
    }
    if (snapshot.mode !== this.mode) {
      throw new Error(`Cannot restore ${snapshot.mode} state into a ${this.mode} engine`);
    }

    const word = this.words.find((candidate) => candidate.id === snapshot.word.id);
    if (!word || word.genre !== snapshot.genre) {
      throw new Error("Restored round word is not available in this engine");
    }
    validateRestoredProgress(snapshot);

    let modifierState = snapshot.modifierState;
    if (modifierState?.id === "double-trouble") {
      const secondaryWordId = modifierState.secondaryWord.id;
      const secondaryWord = this.words.find(
        (candidate) => candidate.id === secondaryWordId,
      );
      if (!secondaryWord || secondaryWord.genre !== word.genre) {
        throw new Error("Restored Double Trouble answer is not available in this engine");
      }
      modifierState = { ...modifierState, secondaryWord };
    }

    this.maximumAttempts = snapshot.maximumAttempts;
    this.difficulty = word.difficulty;
    const maskedAnswer =
      modifierState?.id === "double-trouble" && modifierState.solvedWordIds.includes(word.id)
        ? word.displayAnswer
        : maskAnswer(word.displayAnswer, snapshot.guessedLetters);

    this.state = freezeStateWithScore({
      ...snapshot,
      word,
      maskedAnswer,
      modifierState,
    });
    return this.state;
  }

  beginRound(): Readonly<GameState> {
    if (this.state.status !== "ready") return this.state;
    const timestamp = this.now();
    this.state = freezeState({
      ...this.state,
      status: "playing",
      startedAt: timestamp,
      updatedAt: timestamp,
    });
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

    const secondaryWord = getSecondaryWord(previousState);
    const occurrences =
      countOccurrences(previousState.word.displayAnswer, normalizedLetter) +
      (secondaryWord ? countOccurrences(secondaryWord.displayAnswer, normalizedLetter) : 0);
    const correct = occurrences > 0;
    const guessedLetters = Object.freeze([...previousState.guessedLetters, normalizedLetter]);
    const incorrectLetters = correct
      ? previousState.incorrectLetters
      : Object.freeze([...previousState.incorrectLetters, normalizedLetter]);
    const remainingAttempts = Math.max(0, previousState.remainingAttempts - (correct ? 0 : 1));
    const timer = correct ? previousState.timer : applyIncorrectGuessPenalty(previousState.timer);
    const streak = updateGuessStreak(previousState.streak, correct);
    const metrics = {
      ...previousState.metrics,
      correctGuesses: previousState.metrics.correctGuesses + (correct ? 1 : 0),
      incorrectGuesses: previousState.metrics.incorrectGuesses + (correct ? 0 : 1),
    };
    const modifierState = updateModifierAfterLetter(
      previousState,
      normalizedLetter,
      correct,
      guessedLetters,
    );
    const status = resolveStatus(
      isRoundAnswerComplete(previousState.word, modifierState, guessedLetters),
      remainingAttempts,
      timer,
    );
    const updatedAt = this.now();
    const events: GameEvent[] = [{ type: "LETTER_ACCEPTED", letter: normalizedLetter, correct }];
    appendTimePenaltyEvent(events, previousState.timer, timer);
    appendComboEvent(events, previousState.streak, streak, previousState.mode);
    appendStatusEvent(events, previousState.status, status);

    this.state = freezeStateWithScore({
      ...previousState,
      status,
      maskedAnswer: maskAnswer(previousState.word.displayAnswer, guessedLetters),
      guessedLetters,
      incorrectLetters,
      remainingAttempts,
      timer,
      modifierState,
      metrics,
      streak,
      turn: previousState.turn + 1,
      updatedAt,
      completedAt: isTerminal(status) ? updatedAt : undefined,
    });
    appendScoreEvent(events, previousState.score.total, this.state.score.total);

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

    const solution = evaluateWordSolve(previousState, input);
    if (solution.alreadySolved) {
      return this.unchangedResult("word", input, normalizedGuess, "already-guessed");
    }
    const correct = solution.correct;
    const remainingAttempts = Math.max(0, previousState.remainingAttempts - (correct ? 0 : 1));
    const timer = correct ? previousState.timer : applyIncorrectGuessPenalty(previousState.timer);
    const streak = updateGuessStreak(previousState.streak, correct);
    const completedByFullWord = correct && solution.roundComplete;
    const metrics = {
      ...previousState.metrics,
      correctGuesses: previousState.metrics.correctGuesses + (correct ? 1 : 0),
      incorrectGuesses: previousState.metrics.incorrectGuesses + (correct ? 0 : 1),
      fullWordSolveAttempts: previousState.metrics.fullWordSolveAttempts + 1,
      solvedByFullWord: previousState.metrics.solvedByFullWord || completedByFullWord,
      solvedEntireWordEarly:
        previousState.metrics.solvedEntireWordEarly ||
        (completedByFullWord && isEarlyFullWordSolve(previousState, solution.newlyRevealed)),
    };
    const status: GameStatus = correct
      ? solution.roundComplete
        ? "won"
        : "playing"
      : remainingAttempts === 0 || timer?.remainingSeconds === 0
        ? "lost"
        : "playing";
    const updatedAt = this.now();
    const events: GameEvent[] = [{ type: "ANSWER_ACCEPTED", correct }];
    appendTimePenaltyEvent(events, previousState.timer, timer);
    appendComboEvent(events, previousState.streak, streak, previousState.mode);
    appendStatusEvent(events, previousState.status, status);

    this.state = freezeStateWithScore({
      ...previousState,
      status,
      maskedAnswer: solution.maskedAnswer,
      modifierState: solution.modifierState,
      remainingAttempts,
      timer,
      metrics,
      streak,
      turn: previousState.turn + 1,
      updatedAt,
      completedAt: isTerminal(status) ? updatedAt : undefined,
    });
    appendScoreEvent(events, previousState.score.total, this.state.score.total);

    return buildGuessResult({
      kind: "word",
      input,
      normalizedGuess,
      outcome: correct ? "correct" : "incorrect",
      correct,
      newlyRevealed: solution.newlyRevealed,
      attemptsConsumed: correct ? 0 : 1,
      previousState,
      state: this.state,
      events,
    });
  }

  useHint(hintKind: HintKind = "text-clue"): UseHintResult {
    const previousState = this.state;

    if (previousState.status !== "playing") {
      return buildHintResult({
        outcome: "round-complete",
        hintId: null,
        hintKind: null,
        text: null,
        revealedLetter: null,
        cost: null,
        previousState,
        state: previousState,
        events: [],
      });
    }

    const hint = getHintDefinition(previousState, hintKind);
    if (!hint) {
      return buildHintResult({
        outcome: "unavailable",
        hintId: null,
        hintKind,
        text: null,
        revealedLetter: null,
        cost: null,
        previousState,
        state: previousState,
        events: [],
      });
    }

    const revealableLetters = hint.kind === "reveal-letter" ? getRevealableLetters(previousState) : [];
    const revealedLetter =
      revealableLetters[Math.floor(this.random() * revealableLetters.length)] ?? null;
    const guessedLetters = revealedLetter
      ? Object.freeze([...previousState.guessedLetters, revealedLetter])
      : previousState.guessedLetters;
    const modifierState = revealedLetter
      ? updateModifierAfterLetter(previousState, revealedLetter, true, guessedLetters)
      : previousState.modifierState;
    const timer = applyHintTimeCost(previousState.timer, hint.cost);
    const remainingAttempts =
      hint.cost.type === "attempt"
        ? Math.max(0, previousState.remainingAttempts - hint.cost.attempts)
        : previousState.remainingAttempts;
    const status = resolveStatus(
      isRoundAnswerComplete(previousState.word, modifierState, guessedLetters),
      remainingAttempts,
      timer,
    );
    const updatedAt = this.now();
    const events: GameEvent[] = [
      { type: "HINT_USED", hintId: hint.id, hintKind: hint.kind },
    ];
    appendTimePenaltyEvent(events, previousState.timer, timer);
    appendStatusEvent(events, previousState.status, status);

    this.state = freezeStateWithScore({
      ...previousState,
      status,
      timer,
      remainingAttempts,
      guessedLetters,
      maskedAnswer: revealedLetter
        ? getPrimaryMaskedAnswer(previousState, guessedLetters)
        : previousState.maskedAnswer,
      modifierState,
      hints: {
        usedHintIds: [...previousState.hints.usedHintIds, hint.id],
        usages: [
          ...previousState.hints.usages,
          {
            id: hint.id,
            kind: hint.kind,
            cost: hint.cost,
            ...(revealedLetter ? { revealedLetter } : {}),
          },
        ],
        remaining: previousState.hints.remaining > 0
          ? Math.max(0, previousState.hints.remaining - 1)
          : previousState.hints.remaining,
      },
      updatedAt,
      completedAt: isTerminal(status) ? updatedAt : undefined,
    });
    appendScoreEvent(events, previousState.score.total, this.state.score.total);

    return buildHintResult({
      outcome: "revealed",
      hintId: hint.id,
      hintKind: hint.kind,
      text: hint.kind === "text-clue" ? (previousState.word.hint?.trim() ?? null) : null,
      revealedLetter,
      cost: hint.cost,
      previousState,
      state: this.state,
      events,
    });
  }

  advanceTime(elapsedRealSeconds: number): TimeAdvanceResult {
    if (!Number.isFinite(elapsedRealSeconds) || elapsedRealSeconds < 0) {
      throw new RangeError("elapsedRealSeconds must be a finite, non-negative number");
    }

    const previousState = this.state;
    if (previousState.status !== "playing" || !previousState.timer || elapsedRealSeconds === 0) {
      return buildTimeAdvanceResult({
        elapsedRealSeconds,
        consumedSeconds: 0,
        previousState,
        state: previousState,
        events: [],
      });
    }

    const consumedSeconds = calculateConsumedTimerSeconds(
      previousState.timer,
      previousState.modifiers,
      elapsedRealSeconds,
    );
    const nextRemainingSeconds = Math.max(
      0,
      previousState.timer.remainingSeconds - consumedSeconds,
    );
    const timeAttack = getActiveModifier(previousState.modifiers, "time-attack");
    const accelerated = Boolean(
      timeAttack && nextRemainingSeconds <= timeAttack.config.acceleratedFinalSeconds,
    );
    const timer = Object.freeze({
      ...previousState.timer,
      remainingSeconds: nextRemainingSeconds,
      elapsedRealSeconds: previousState.timer.elapsedRealSeconds + elapsedRealSeconds,
      rateMultiplier: accelerated
        ? (timeAttack?.config.timerRateMultiplier ?? previousState.timer.rateMultiplier)
        : 1,
    });
    let modifierState = expireTimedModifierState(
      previousState.modifierState,
      timer.elapsedRealSeconds,
    );
    if (modifierState?.id === "time-attack") {
      modifierState = { ...modifierState, accelerated };
    }
    const status: GameStatus = timer.remainingSeconds === 0 ? "lost" : "playing";
    const updatedAt = this.now();
    const events: GameEvent[] = [{ type: "TIME_ADVANCED", elapsedRealSeconds, consumedSeconds }];
    appendStatusEvent(events, previousState.status, status);

    this.state = freezeStateWithScore({
      ...previousState,
      timer,
      modifierState,
      status,
      updatedAt,
      completedAt: isTerminal(status) ? updatedAt : undefined,
    });
    appendScoreEvent(events, previousState.score.total, this.state.score.total);

    return buildTimeAdvanceResult({
      elapsedRealSeconds,
      consumedSeconds,
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
      maximumAttempts: this.maximumAttempts,
      modeRules: this.modeRules,
      modifiers: this.state.modifiers,
      secondaryWord: getSecondaryWord(this.state),
      timestamp: this.now(),
    });
    return this.state;
  }

  startNewRound(options: StartNewRoundOptions = {}): Readonly<GameState> {
    this.difficulty = options.difficulty ?? this.difficulty;
    this.maximumAttempts = assertMaximumAttempts(options.maximumAttempts ?? this.maximumAttempts);

    const isInitialRound = this.state === undefined;
    const currentWordId = this.state?.word.id;
    const requestedExclusions = options.excludeWordIds ?? (currentWordId ? [currentWordId] : []);
    const modifiers = this.selectRoundModifiers();
    const wordPool = this.modeRules.wordPool;
    const selectionOptions = {
      difficulty: this.difficulty,
      difficulties: this.difficulty === undefined ? wordPool.difficulties : undefined,
      excludeWordIds: requestedExclusions,
      randomValue: this.random(),
    } as const;
    const initialWord =
      isInitialRound && this.initialWordId
        ? this.words.find((candidate) => candidate.id === this.initialWordId)
        : undefined;
    let word =
      initialWord ??
      selectWord(this.words, selectionOptions) ??
      selectWord(this.words, { ...selectionOptions, excludeWordIds: [], randomValue: this.random() });

    if (!word) {
      throw new Error("No words are available in the supplied pool for the requested difficulty");
    }

    if (getActiveModifier(modifiers, "double-trouble")) {
      word = this.selectConnectedPrimaryWord(word, modifiers);
    }

    const roundNumber = (this.state?.roundNumber ?? 0) + 1;
    const secondaryWord = this.selectSecondaryWord(word, modifiers);
    this.state = createRoundState({
      gameId: this.gameId,
      roundId: this.createRoundId(roundNumber),
      roundNumber,
      word,
      mode: this.mode,
      maximumAttempts: this.maximumAttempts,
      modeRules: this.modeRules,
      modifiers,
      secondaryWord,
      timestamp: this.now(),
    });
    return this.state;
  }

  private selectRoundModifiers(): readonly ActiveModifier[] {
    const selection = this.modeRules.modifierSelection;
    if (!selection) return Object.freeze([]);

    const selected = selectRoundModifier(ULTRA_MAX_MODIFIERS, selection.pool, this.random());
    if (!selected) throw new Error(`No enabled modifiers are available for mode "${this.mode}"`);

    return Object.freeze([selected]);
  }

  private selectSecondaryWord(
    primaryWord: Readonly<WordEntry>,
    modifiers: readonly ActiveModifier[],
  ): Readonly<WordEntry> | null {
    const doubleTrouble = getActiveModifier(modifiers, "double-trouble");
    if (!doubleTrouble) return null;

    const candidates = this.words.filter(
      (candidate) =>
        candidate.id !== primaryWord.id &&
        candidate.genre === primaryWord.genre &&
        this.modeRules.wordPool.difficulties.includes(candidate.difficulty),
    );
    const connectionKey = doubleTrouble.config.connectionMetadataKey;
    const connectionValue = primaryWord.metadata?.[connectionKey];
    const connectedCandidates =
      connectionValue === undefined
        ? []
        : candidates.filter((candidate) => candidate.metadata?.[connectionKey] === connectionValue);
    const pool = connectedCandidates.length > 0 ? connectedCandidates : candidates;
    if (pool.length === 0) {
      throw new Error("Double Trouble requires at least two eligible words in the category pool");
    }

    return pool[Math.floor(this.random() * pool.length)] ?? pool[0] ?? null;
  }

  private selectConnectedPrimaryWord(
    preferredWord: Readonly<WordEntry>,
    modifiers: readonly ActiveModifier[],
  ): Readonly<WordEntry> {
    const doubleTrouble = getActiveModifier(modifiers, "double-trouble");
    if (!doubleTrouble) return preferredWord;
    const connectionKey = doubleTrouble.config.connectionMetadataKey;
    const eligible = this.words.filter(
      (candidate) =>
        candidate.genre === preferredWord.genre &&
        this.modeRules.wordPool.difficulties.includes(candidate.difficulty),
    );
    const connectedPrimaries = eligible.filter((candidate) => {
      const connectionValue = candidate.metadata?.[connectionKey];
      return (
        connectionValue !== undefined &&
        eligible.some(
          (other) =>
            other.id !== candidate.id && other.metadata?.[connectionKey] === connectionValue,
        )
      );
    });
    if (connectedPrimaries.length === 0) return preferredWord;
    if (connectedPrimaries.some((candidate) => candidate.id === preferredWord.id)) {
      return preferredWord;
    }
    return (
      connectedPrimaries[Math.floor(this.random() * connectedPrimaries.length)] ??
      connectedPrimaries[0] ??
      preferredWord
    );
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
  maximumAttempts: number;
  modeRules: Readonly<GameModeRules>;
  modifiers: readonly ActiveModifier[];
  secondaryWord: Readonly<WordEntry> | null;
  timestamp: string;
}

function createRoundState(options: CreateRoundStateOptions): Readonly<GameState> {
  return freezeStateWithScore({
    schemaVersion: 1,
    gameId: options.gameId,
    roundId: options.roundId,
    roundNumber: options.roundNumber,
    status: options.modeRules.modifierSelection ? "ready" : "playing",
    mode: options.mode,
    genre: options.word.genre,
    word: options.word,
    maskedAnswer: maskAnswer(options.word.displayAnswer),
    guessedLetters: [],
    incorrectLetters: [],
    remainingAttempts: options.maximumAttempts,
    maximumAttempts: options.maximumAttempts,
    timer: createTimerState(options.modeRules.timer, options.modifiers),
    turn: 0,
    hints: {
      usedHintIds: [],
      usages: [],
      remaining: options.modeRules.hints.enabled ? options.modeRules.hints.freeHints : 0,
    },
    modifiers: options.modifiers,
    modifierState: createModifierRuntimeState(options.modifiers, options.secondaryWord),
    metrics: {
      correctGuesses: 0,
      incorrectGuesses: 0,
      fullWordSolveAttempts: 0,
      solvedByFullWord: false,
      solvedEntireWordEarly: false,
    },
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
    modifierState: freezeModifierRuntimeState(state.modifierState),
    hints: Object.freeze({
      ...state.hints,
      usedHintIds: Object.freeze([...state.hints.usedHintIds]),
      usages: Object.freeze(
        state.hints.usages.map((usage) =>
          Object.freeze({ ...usage, cost: Object.freeze({ ...usage.cost }) }),
        ),
      ),
    }),
    score: Object.freeze({ ...state.score }),
    metrics: Object.freeze({ ...state.metrics }),
    streak: Object.freeze({ ...state.streak }),
  });
}

function freezeModifierRuntimeState(
  runtime: Readonly<ModifierRuntimeState> | null,
): Readonly<ModifierRuntimeState> | null {
  if (!runtime) return null;

  switch (runtime.id) {
    case "memory":
      return Object.freeze({
        ...runtime,
        revealedLetters: Object.freeze(
          runtime.revealedLetters.map((entry) => Object.freeze({ ...entry })),
        ),
      });
    case "keyboard-amnesia":
      return Object.freeze({
        ...runtime,
        visibleIncorrectKeys: Object.freeze(
          runtime.visibleIncorrectKeys.map((entry) => Object.freeze({ ...entry })),
        ),
      });
    case "double-trouble":
      return Object.freeze({
        ...runtime,
        secondaryWord: freezeWord(runtime.secondaryWord),
        solvedWordIds: Object.freeze([...runtime.solvedWordIds]),
      });
    default:
      return Object.freeze({ ...runtime });
  }
}

function freezeStateWithScore(state: GameState): Readonly<GameState> {
  return freezeState({ ...state, score: calculateScore(state) });
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
    baseScore: 0,
    startingBaseScore: 0,
    wordLength: 0,
    wordLengthBonus: 0,
    progressMultiplier: 0,
    difficultyMultiplier: 1,
    modeMultiplier: 1,
    remainingTimeSeconds: null,
    remainingTimeMultiplier: 1,
    accuracyPercent: 100,
    accuracyMultiplier: 1,
    comboMultiplier: 1,
    timeBonus: 0,
    multipliedScore: 0,
    lettersGuessed: 0,
    remainingLetters: 0,
    wrongGuesses: 0,
    hintsUsed: 0,
    hintPenaltyPercent: 0,
    hintPenalty: 0,
    earlySolve: false,
    earlySolveBonus: 0,
    perfectSolve: false,
    perfectSolveBonus: 0,
    clutch: false,
    clutchBonus: 0,
    modifierBonus: 0,
    total: 0,
  };
}

function getComboMultiplier(mode: GameMode, consecutiveCorrectGuesses: number): number {
  return mode === "ultra" ? getUltraComboMultiplier(consecutiveCorrectGuesses) : 1;
}

function assertMaximumAttempts(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError("maximumAttempts must be a positive integer");
  }
  return value;
}

function validateRestoredProgress(state: Readonly<GameState>): void {
  assertMaximumAttempts(state.maximumAttempts);
  if (
    !Number.isInteger(state.remainingAttempts) ||
    state.remainingAttempts < 0 ||
    state.remainingAttempts > state.maximumAttempts
  ) {
    throw new Error("Restored remainingAttempts is invalid");
  }
  if (!Number.isInteger(state.turn) || state.turn < 0) {
    throw new Error("Restored turn is invalid");
  }

  const normalizedGuesses = state.guessedLetters.map(normalizeLetter);
  if (
    normalizedGuesses.some((letter) => letter === null) ||
    new Set(normalizedGuesses).size !== normalizedGuesses.length
  ) {
    throw new Error("Restored guessedLetters is invalid");
  }
  if (
    state.incorrectLetters.some(
      (letter) => normalizeLetter(letter) !== letter || !state.guessedLetters.includes(letter),
    )
  ) {
    throw new Error("Restored incorrectLetters is invalid");
  }

  const expectsTimer = GAME_MODES_BY_ID[state.mode].rules.timer !== null;
  if (expectsTimer !== Boolean(state.timer)) {
    throw new Error("Restored timer does not match the game mode");
  }
  if (
    state.timer &&
    (!Number.isFinite(state.timer.durationSeconds) ||
      !Number.isFinite(state.timer.remainingSeconds) ||
      !Number.isFinite(state.timer.elapsedRealSeconds) ||
      state.timer.durationSeconds <= 0 ||
      state.timer.remainingSeconds < 0 ||
      state.timer.remainingSeconds > state.timer.durationSeconds ||
      state.timer.elapsedRealSeconds < 0)
  ) {
    throw new Error("Restored timer is invalid");
  }
}

function createTimerState(
  rules: Readonly<TimerModeRules> | null,
  modifiers: readonly ActiveModifier[],
): Readonly<GameTimerState> | null {
  if (!rules) return null;

  const doubleTrouble = getActiveModifier(modifiers, "double-trouble");
  const durationSeconds = rules.durationSeconds + (doubleTrouble?.config.timerBonusSeconds ?? 0);

  return Object.freeze({
    ...rules,
    durationSeconds,
    remainingSeconds: durationSeconds,
    elapsedRealSeconds: 0,
    rateMultiplier: rules.rateMultiplier,
  });
}

function applyIncorrectGuessPenalty(
  timer: Readonly<GameTimerState> | null,
): Readonly<GameTimerState> | null {
  if (!timer) return null;
  return Object.freeze({
    ...timer,
    remainingSeconds: Math.max(0, timer.remainingSeconds - timer.incorrectGuessPenaltySeconds),
  });
}

function applyHintTimeCost(
  timer: Readonly<GameTimerState> | null,
  cost: Readonly<HintCost>,
): Readonly<GameTimerState> | null {
  if (!timer || cost.type !== "time") return timer;
  return Object.freeze({
    ...timer,
    remainingSeconds: Math.max(0, timer.remainingSeconds - cost.seconds),
  });
}

function calculateConsumedTimerSeconds(
  timer: Readonly<GameTimerState>,
  modifiers: readonly ActiveModifier[],
  elapsedRealSeconds: number,
): number {
  const timeAttack = getActiveModifier(modifiers, "time-attack");
  if (!timeAttack) return elapsedRealSeconds * timer.rateMultiplier;

  const threshold = timeAttack.config.acceleratedFinalSeconds;
  const multiplier = timeAttack.config.timerRateMultiplier;
  if (timer.remainingSeconds <= threshold) return elapsedRealSeconds * multiplier;

  const normalSecondsRemaining = timer.remainingSeconds - threshold;
  if (elapsedRealSeconds <= normalSecondsRemaining) return elapsedRealSeconds;
  return normalSecondsRemaining + (elapsedRealSeconds - normalSecondsRemaining) * multiplier;
}

function updateModifierAfterLetter(
  state: Readonly<GameState>,
  letter: string,
  correct: boolean,
  guessedLetters: readonly string[],
): ModifierRuntimeState | null {
  const runtime = state.modifierState;
  if (!runtime) return null;
  const elapsedRealSeconds = state.timer?.elapsedRealSeconds ?? 0;

  switch (runtime.id) {
    case "memory": {
      if (!correct) return { ...runtime };
      const modifier = getActiveModifier(state.modifiers, "memory");
      const visibleUntilElapsedSeconds =
        elapsedRealSeconds + (modifier?.config.revealedLetterVisibleSeconds ?? 4);
      return {
        ...runtime,
        revealedLetters: [
          ...runtime.revealedLetters.filter((entry) => entry.letter !== letter),
          { letter, visibleUntilElapsedSeconds },
        ],
      };
    }
    case "hidden-length": {
      const modifier = getActiveModifier(state.modifiers, "hidden-length");
      const shouldReveal = modifier?.config.revealAfterFirstCorrectGuess
        ? correct
        : state.turn >= 0;
      return {
        ...runtime,
        structureRevealed: runtime.structureRevealed || shouldReveal,
      };
    }
    case "keyboard-amnesia": {
      if (correct) return { ...runtime };
      const modifier = getActiveModifier(state.modifiers, "keyboard-amnesia");
      return {
        ...runtime,
        visibleIncorrectKeys: addVisibleIncorrectKey(
          runtime.visibleIncorrectKeys,
          letter,
          elapsedRealSeconds + (modifier?.config.incorrectKeyUnavailableSeconds ?? 3),
        ),
      };
    }
    case "double-trouble": {
      const solvedWordIds = new Set(runtime.solvedWordIds);
      if (isAnswerComplete(state.word.displayAnswer, guessedLetters)) {
        solvedWordIds.add(state.word.id);
      }
      if (isAnswerComplete(runtime.secondaryWord.displayAnswer, guessedLetters)) {
        solvedWordIds.add(runtime.secondaryWord.id);
      }
      return {
        ...runtime,
        maskedSecondaryAnswer: solvedWordIds.has(runtime.secondaryWord.id)
          ? runtime.secondaryWord.displayAnswer
          : maskAnswer(runtime.secondaryWord.displayAnswer, guessedLetters),
        solvedWordIds: [...solvedWordIds],
      };
    }
    case "time-attack":
      return { ...runtime };
  }
}

function getPrimaryMaskedAnswer(
  state: Readonly<GameState>,
  guessedLetters: readonly string[],
): string {
  if (
    state.modifierState?.id === "double-trouble" &&
    state.modifierState.solvedWordIds.includes(state.word.id)
  ) {
    return state.word.displayAnswer;
  }
  return maskAnswer(state.word.displayAnswer, guessedLetters);
}

function isRoundAnswerComplete(
  primaryWord: Readonly<WordEntry>,
  modifierState: Readonly<ModifierRuntimeState> | null,
  guessedLetters: readonly string[],
): boolean {
  if (modifierState?.id === "memory") {
    return false;
  }
  if (modifierState?.id !== "double-trouble") {
    return isAnswerComplete(primaryWord.displayAnswer, guessedLetters);
  }

  return (
    isAnswerComplete(primaryWord.displayAnswer, guessedLetters) &&
    isAnswerComplete(modifierState.secondaryWord.displayAnswer, guessedLetters)
  );
}

interface WordSolveEvaluation {
  alreadySolved: boolean;
  correct: boolean;
  maskedAnswer: string;
  modifierState: Readonly<ModifierRuntimeState> | null;
  newlyRevealed: number;
  roundComplete: boolean;
}

function evaluateWordSolve(
  state: Readonly<GameState>,
  input: string,
): WordSolveEvaluation {
  const runtime = state.modifierState;
  if (runtime?.id !== "double-trouble") {
    const correct = matchesWordAnswer(state.word, input);
    return {
      alreadySolved: false,
      correct,
      maskedAnswer: correct ? state.word.displayAnswer : state.maskedAnswer,
      modifierState: runtime,
      newlyRevealed: correct ? countHiddenCharacters(state.maskedAnswer) : 0,
      roundComplete: correct,
    };
  }

  const primaryMatch = matchesWordAnswer(state.word, input);
  const secondaryMatch = matchesWordAnswer(runtime.secondaryWord, input);
  const matchedWord = primaryMatch
    ? state.word
    : secondaryMatch
      ? runtime.secondaryWord
      : null;
  if (matchedWord && runtime.solvedWordIds.includes(matchedWord.id)) {
    return {
      alreadySolved: true,
      correct: false,
      maskedAnswer: state.maskedAnswer,
      modifierState: runtime,
      newlyRevealed: 0,
      roundComplete: false,
    };
  }

  if (!matchedWord) {
    return {
      alreadySolved: false,
      correct: false,
      maskedAnswer: state.maskedAnswer,
      modifierState: runtime,
      newlyRevealed: 0,
      roundComplete: false,
    };
  }

  const solvedWordIds = [...runtime.solvedWordIds, matchedWord.id];
  const solvedPrimary = matchedWord.id === state.word.id;
  const maskedAnswer = solvedPrimary ? state.word.displayAnswer : state.maskedAnswer;
  const maskedSecondaryAnswer = solvedPrimary
    ? runtime.maskedSecondaryAnswer
    : runtime.secondaryWord.displayAnswer;

  return {
    alreadySolved: false,
    correct: true,
    maskedAnswer,
    modifierState: {
      ...runtime,
      maskedSecondaryAnswer,
      solvedWordIds,
    },
    newlyRevealed: countHiddenCharacters(
      solvedPrimary ? state.maskedAnswer : runtime.maskedSecondaryAnswer,
    ),
    roundComplete: solvedWordIds.length === 2,
  };
}

function countHiddenCharacters(maskedAnswer: string): number {
  return [...maskedAnswer].filter((character) => character === "_").length;
}

function isEarlyFullWordSolve(state: Readonly<GameState>, newlyRevealed: number): boolean {
  const secondaryWord = getSecondaryWord(state);
  const totalCharacters =
    countGuessableCharacters(state.word.displayAnswer) +
    (secondaryWord ? countGuessableCharacters(secondaryWord.displayAnswer) : 0);
  return totalCharacters > 0 && newlyRevealed / totalCharacters >= 0.5;
}

function resolveStatus(
  answerComplete: boolean,
  remainingAttempts: number,
  timer: Readonly<GameTimerState> | null,
): GameStatus {
  if (answerComplete) return "won";
  if (remainingAttempts === 0 || timer?.remainingSeconds === 0) return "lost";
  return "playing";
}

function isTerminal(status: GameStatus): boolean {
  return status === "won" || status === "lost";
}

function appendStatusEvent(events: GameEvent[], previous: GameStatus, current: GameStatus): void {
  if (previous !== current) events.push({ type: "STATUS_CHANGED", from: previous, to: current });
}

function appendComboEvent(
  events: GameEvent[],
  previous: Readonly<StreakState>,
  current: Readonly<StreakState>,
  mode: GameMode,
): void {
  if (previous.current === current.current) return;
  events.push({
    type: "COMBO_CHANGED",
    from: previous.current,
    to: current.current,
    multiplier: getComboMultiplier(mode, current.current),
  });
}

function appendScoreEvent(events: GameEvent[], previous: number, current: number): void {
  if (previous === current) return;

  const scoreEvent: GameEvent = { type: "SCORE_CHANGED", difference: current - previous };
  const statusEventIndex = events.findIndex((event) => event.type === "STATUS_CHANGED");

  if (statusEventIndex === -1) {
    events.push(scoreEvent);
    return;
  }

  events.splice(statusEventIndex, 0, scoreEvent);
}

function appendTimePenaltyEvent(
  events: GameEvent[],
  previous: Readonly<GameTimerState> | null,
  current: Readonly<GameTimerState> | null,
): void {
  if (!previous || !current) return;
  const seconds = previous.remainingSeconds - current.remainingSeconds;
  if (seconds > 0) events.push({ type: "TIME_PENALTY_APPLIED", seconds });
}

function buildGuessResult(result: GuessResult): GuessResult {
  return Object.freeze({ ...result, events: Object.freeze([...result.events]) });
}

function buildTimeAdvanceResult(result: TimeAdvanceResult): TimeAdvanceResult {
  return Object.freeze({ ...result, events: Object.freeze([...result.events]) });
}

function buildHintResult(result: UseHintResult): UseHintResult {
  return Object.freeze({ ...result, events: Object.freeze([...result.events]) });
}
