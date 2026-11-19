import { describe, expect, it } from "vitest";

import type { GameState } from "../types/game-state";
import type { WordEntry } from "../types/word";
import {
  getForgottenIncorrectLetters,
  getSecondaryWord,
  getVisibleAnswers,
  getVisibleIncorrectLetters,
} from "../modifiers/runtime";
import { countOccurrences, maskAnswer, normalizeAnswer } from "./answer";
import { createGameEngine } from "./game-engine";
import { selectWord } from "./word-selection";

const words = [
  {
    id: "dark-knight",
    answer: "THE DARK KNIGHT",
    displayAnswer: "The Dark Knight",
    genre: "movies",
    difficulty: "easy",
    hint: "A caped crusader",
  },
  {
    id: "gta",
    answer: "GRAND THEFT AUTO",
    displayAnswer: "Grand Theft Auto",
    genre: "video-games",
    difficulty: "medium",
  },
  {
    id: "manchester-united",
    answer: "MANCHESTER UNITED",
    displayAnswer: "Manchester United",
    genre: "sports",
    difficulty: "hard",
  },
] as const satisfies readonly WordEntry[];

function createTestEngine(overrides: Partial<Parameters<typeof createGameEngine>[0]> = {}) {
  let timestamp = 0;
  return createGameEngine({
    words,
    gameId: "game-test",
    random: () => 0,
    now: () => `2026-01-01T00:00:0${timestamp++}.000Z`,
    createRoundId: (roundNumber) => `round-${roundNumber}`,
    ...overrides,
  });
}

describe("answer utilities", () => {
  it("reveals spaces, punctuation, and hyphens automatically", () => {
    expect(maskAnswer("Spider-Man: No Way Home!")).toBe("______-___: __ ___ ____!");
    expect(maskAnswer("Spider-Man", ["s", "m"])).toBe("S_____-M__");
  });

  it("normalizes phrases without requiring punctuation", () => {
    expect(normalizeAnswer("  grand-theft auto! ")).toBe("GRANDTHEFTAUTO");
  });

  it("reveals apostrophes and every repeated occurrence without charging for punctuation", () => {
    expect(maskAnswer("Ocean's Eleven", ["o"])).toBe("O____'_ ______");
    expect(countOccurrences("Mississippi", "s")).toBe(4);
  });
});

describe("word selection", () => {
  it("selects deterministically from the supplied pool by difficulty", () => {
    expect(selectWord(words, { difficulty: "hard", randomValue: 0 })?.id).toBe(
      "manchester-united",
    );
    expect(selectWord(words, { difficulty: "brutal", randomValue: 0 })).toBeNull();
  });

  it("supports exclusions without knowing category selection", () => {
    expect(
      selectWord(words, { excludeWordIds: ["dark-knight"], randomValue: 0 })?.id,
    ).toBe("gta");
  });
});

describe("HangmanGameEngine", () => {
  it("rejects duplicate word IDs", () => {
    expect(() => createTestEngine({ words: [words[0], { ...words[0] }] })).toThrow(
      'Duplicate WordEntry id: "dark-knight"',
    );
  });

  it("starts with a hidden phrase and configured attempts", () => {
    const state = createTestEngine({ maximumAttempts: 7 }).getState();

    expect(state.status).toBe("playing");
    expect(state.maskedAnswer).toBe("___ ____ ______");
    expect(state.remainingAttempts).toBe(7);
    expect(state.guessedLetters).toEqual([]);
  });

  it("tracks correct, incorrect, and duplicate letter guesses", () => {
    const engine = createTestEngine();
    const correct = engine.guessLetter("t");
    const incorrect = engine.guessLetter("z");
    const duplicate = engine.guessLetter("T");

    expect(correct.outcome).toBe("correct");
    expect(correct.newlyRevealed).toBe(2);
    expect(correct.state.maskedAnswer).toBe("T__ ____ _____t");
    expect(incorrect.outcome).toBe("incorrect");
    expect(incorrect.state.remainingAttempts).toBe(6);
    expect(incorrect.state.incorrectLetters).toEqual(["Z"]);
    expect(duplicate.outcome).toBe("already-guessed");
    expect(duplicate.state.turn).toBe(2);
    expect(duplicate.state.remainingAttempts).toBe(6);
  });

  it("does not consume an attempt for invalid guesses", () => {
    const engine = createTestEngine();
    expect(engine.guessLetter("AB").outcome).toBe("invalid");
    expect(engine.guessLetter("-").outcome).toBe("invalid");
    expect(engine.getState().remainingAttempts).toBe(7);
  });

  it("wins when every guessable character is revealed", () => {
    const engine = createTestEngine({
      words: [
        {
          id: "a-a",
          answer: "A A",
          displayAnswer: "A-A",
          genre: "general-knowledge",
          difficulty: "easy",
        },
      ],
    });

    const result = engine.guessLetter("a");
    expect(result.state.status).toBe("won");
    expect(result.state.maskedAnswer).toBe("A-A");
    expect(result.events.at(-1)).toEqual({ type: "STATUS_CHANGED", from: "playing", to: "won" });
  });

  it("does not treat a literal underscore as a hidden character", () => {
    const engine = createTestEngine({
      words: [
        {
          id: "a-b",
          answer: "A_B",
          displayAnswer: "A_B",
          genre: "general-knowledge",
          difficulty: "easy",
        },
      ],
    });

    engine.guessLetter("a");
    const result = engine.guessLetter("b");
    expect(result.state.status).toBe("won");
    expect(result.state.maskedAnswer).toBe("A_B");
  });

  it("loses when no attempts remain", () => {
    const engine = createTestEngine({ maximumAttempts: 2 });
    engine.guessLetter("z");
    const result = engine.guessLetter("q");

    expect(result.state.status).toBe("lost");
    expect(result.state.remainingAttempts).toBe(0);
    expect(engine.guessLetter("x").outcome).toBe("round-complete");
  });

  it("solves a full phrase without requiring matching punctuation or case", () => {
    const engine = createTestEngine({ words: [words[1]] });
    const result = engine.solveWord("grand-theft auto!");

    expect(result.correct).toBe(true);
    expect(result.state.status).toBe("won");
    expect(result.state.maskedAnswer).toBe("Grand Theft Auto");
  });

  it("charges one attempt for an incorrect full-word solve", () => {
    const engine = createTestEngine({ words: [words[2]], difficulty: "hard" });
    const result = engine.solveWord("Manchester City");

    expect(result.outcome).toBe("incorrect");
    expect(result.attemptsConsumed).toBe(1);
    expect(result.state.remainingAttempts).toBe(6);
  });

  it("reveals a free text hint once in the classic mode", () => {
    const engine = createTestEngine();
    const hint = engine.useHint();

    expect(hint.outcome).toBe("revealed");
    expect(hint.text).toBe("A caped crusader");
    expect(hint.hintKind).toBe("text-clue");
    expect(hint.cost).toEqual({ type: "none" });
    expect(hint.state.hints.remaining).toBe(0);
    expect(hint.state.score.hintPenalty).toBe(0);
    expect(engine.useHint().outcome).toBe("unavailable");
  });

  it("can spend the classic free hint to reveal one letter", () => {
    const engine = createTestEngine();
    const hint = engine.useHint("reveal-letter");

    expect(hint.outcome).toBe("revealed");
    expect(hint.revealedLetter).toBe("T");
    expect(hint.state.guessedLetters).toEqual(["T"]);
    expect(hint.state.maskedAnswer).toBe("T__ ____ _____t");
    expect(hint.state.hints.remaining).toBe(0);
    expect(engine.getAvailableHints()).toEqual([]);
  });

  it("applies the configured score cost for an Ultra hint", () => {
    const engine = createTestEngine({
      mode: "ultra",
      words: [
        {
          id: "hard-movie-hint",
          answer: "INCEPTION",
          displayAnswer: "Inception",
          genre: "movies",
          difficulty: "hard",
          hint: "A dream within a dream",
        },
      ],
    });

    const guess = engine.guessLetter("i");
    const hint = engine.useHint();

    expect(guess.state.score.total).toBeGreaterThan(0);
    expect(hint.cost).toEqual({ type: "score-percent", percent: 10 });
    expect(hint.state.score.hintPenaltyPercent).toBe(10);
    expect(hint.state.score.hintPenalty).toBeGreaterThan(0);
    expect(hint.state.score.total).toBeLessThan(guess.state.score.total);
  });

  it("charges Ultra twenty percent for a revealed letter", () => {
    const engine = createTestEngine({
      mode: "ultra",
      words: [
        {
          id: "hard-movie-reveal",
          answer: "INCEPTION",
          displayAnswer: "Inception",
          genre: "movies",
          difficulty: "hard",
          hint: "A dream within a dream",
        },
      ],
    });

    const hint = engine.useHint("reveal-letter");

    expect(hint.revealedLetter).toBe("I");
    expect(hint.cost).toEqual({ type: "score-percent", percent: 20 });
    engine.guessLetter("n");
    expect(engine.getState().score.hintPenaltyPercent).toBe(20);
    expect(engine.getState().score.hintPenalty).toBeGreaterThan(0);
  });

  it("applies each explicit Ultra Max hint sacrifice", () => {
    const engine = createTestEngine({
      mode: "ultra-max",
      words: [
        {
          id: "brutal-movie-hints",
          answer: "INTERSTELLAR",
          displayAnswer: "Interstellar",
          genre: "movies",
          difficulty: "brutal",
          hint: "A journey beyond the solar system",
        },
      ],
    });
    engine.beginRound();

    const category = engine.useHint("show-category");
    expect(category.cost).toEqual({ type: "time", seconds: 15 });
    expect(category.state.timer?.remainingSeconds).toBe(30);

    const clue = engine.useHint("text-clue");
    expect(clue.cost).toEqual({ type: "time", seconds: 10 });
    expect(clue.state.timer?.remainingSeconds).toBe(20);

    const reveal = engine.useHint("reveal-letter");
    expect(reveal.cost).toEqual({ type: "attempt", attempts: 1 });
    expect(reveal.state.remainingAttempts).toBe(3);
    expect(engine.getAvailableHints()).toEqual([]);
  });

  it("ends an Ultra Max round when a reveal-letter hint spends the final life", () => {
    const engine = createTestEngine({
      mode: "ultra-max",
      maximumAttempts: 1,
      random: () => 0.21,
      words: [
        {
          id: "hard-movie-last-life",
          answer: "INTERSTELLAR",
          displayAnswer: "Interstellar",
          genre: "movies",
          difficulty: "brutal",
          hint: "A journey beyond the solar system",
        },
      ],
    });
    engine.beginRound();

    const hint = engine.useHint("reveal-letter");

    expect(hint.outcome).toBe("revealed");
    expect(hint.state.remainingAttempts).toBe(0);
    expect(hint.state.status).toBe("lost");
    expect(hint.events).toContainEqual({
      type: "STATUS_CHANGED",
      from: "playing",
      to: "lost",
    });
  });

  it("applies Ultra attempts, timer penalties, and time progression", () => {
    const engine = createTestEngine({
      mode: "ultra",
      words: [
        {
          id: "hard-movie",
          answer: "INCEPTION",
          displayAnswer: "Inception",
          genre: "movies",
          difficulty: "hard",
        },
      ],
    });

    expect(engine.getState().maximumAttempts).toBe(5);
    expect(engine.getState().timer?.remainingSeconds).toBe(60);

    const guess = engine.guessLetter("z");
    expect(guess.state.remainingAttempts).toBe(4);
    expect(guess.state.timer?.remainingSeconds).toBe(55);
    expect(guess.events).toContainEqual({ type: "TIME_PENALTY_APPLIED", seconds: 5 });

    const time = engine.advanceTime(10);
    expect(time.consumedSeconds).toBe(10);
    expect(time.state.timer?.remainingSeconds).toBe(45);
  });

  it("builds Ultra combos, accrues combo score, and resets on an incorrect guess", () => {
    const engine = createTestEngine({
      mode: "ultra",
      words: [
        {
          id: "ultra-combo-movie",
          answer: "INCEPTION",
          displayAnswer: "Inception",
          genre: "movies",
          difficulty: "hard",
        },
      ],
    });

    const first = engine.guessLetter("i");
    const second = engine.guessLetter("n");
    const third = engine.guessLetter("c");

    expect(first.state.streak).toMatchObject({ current: 1, best: 1 });
    expect(first.state.score.total).toBeGreaterThan(0);
    expect(second.state.streak).toMatchObject({ current: 2, best: 2 });
    expect(second.state.score.comboMultiplier).toBe(1.2);
    expect(second.state.score.total).toBeGreaterThan(first.state.score.total);
    expect(second.events).toContainEqual({
      type: "COMBO_CHANGED",
      from: 1,
      to: 2,
      multiplier: 1.2,
    });
    expect(third.state.streak).toMatchObject({ current: 3, best: 3 });
    expect(third.state.score.comboMultiplier).toBe(1.5);

    const incorrect = engine.guessLetter("z");
    expect(incorrect.state.streak).toMatchObject({ current: 0, best: 3 });
    expect(incorrect.state.score.comboMultiplier).toBe(1.5);
    expect(incorrect.events).toContainEqual({
      type: "COMBO_CHANGED",
      from: 3,
      to: 0,
      multiplier: 1,
    });

    const nextCorrect = engine.guessLetter("e");
    expect(nextCorrect.state.streak).toMatchObject({ current: 1, best: 3 });
    expect(nextCorrect.state.score.comboMultiplier).toBe(1.5);
  });

  it("uses the harder word pool for Ultra", () => {
    const engine = createTestEngine({
      mode: "ultra",
      words: [
        words[0],
        {
          id: "hard-movie",
          answer: "INCEPTION",
          displayAnswer: "Inception",
          genre: "movies",
          difficulty: "hard",
        },
      ],
    });

    expect(engine.getState().word.id).toBe("hard-movie");
  });

  it("activates exactly one Ultra Max modifier and applies Time Attack", () => {
    const randomValues = [0.65, 0];
    const engine = createTestEngine({
      mode: "ultra-max",
      random: () => randomValues.shift() ?? 0,
      words: [
        {
          id: "hardest-movie",
          answer: "INTERSTELLAR",
          displayAnswer: "Interstellar",
          genre: "movies",
          difficulty: "brutal",
        },
      ],
    });

    const state = engine.getState();
    expect(state.maximumAttempts).toBe(4);
    expect(state.status).toBe("ready");
    expect(state.modifiers).toHaveLength(1);
    expect(state.modifiers[0]?.id).toBe("time-attack");
    expect(state.timer?.rateMultiplier).toBe(1);

    expect(engine.advanceTime(10).consumedSeconds).toBe(0);
    engine.beginRound();
    const normalTime = engine.advanceTime(30);
    expect(normalTime.consumedSeconds).toBe(30);
    expect(normalTime.state.timer?.remainingSeconds).toBe(15);
    expect(normalTime.state.timer?.rateMultiplier).toBe(1.5);

    const acceleratedTime = engine.advanceTime(4);
    expect(acceleratedTime.consumedSeconds).toBe(6);
    expect(acceleratedTime.state.timer?.remainingSeconds).toBe(9);
  });

  it("keeps a modifier on reset and selects one modifier again for a new round", () => {
    const randomValues = [0, 0, 0.99, 0, 0];
    const engine = createTestEngine({
      mode: "ultra-max",
      random: () => randomValues.shift() ?? 0,
      words: [
        {
          id: "hardest-movie",
          answer: "INTERSTELLAR",
          displayAnswer: "Interstellar",
          genre: "movies",
          difficulty: "brutal",
        },
        {
          id: "second-hardest-movie",
          answer: "THE PRESTIGE",
          displayAnswer: "The Prestige",
          genre: "movies",
          difficulty: "brutal",
        },
      ],
    });

    expect(engine.getState().modifiers[0]?.id).toBe("memory");
    expect(engine.resetRound().modifiers[0]?.id).toBe("memory");
    expect(engine.startNewRound().modifiers).toHaveLength(1);
    expect(engine.getState().modifiers[0]?.id).toBe("double-trouble");
    expect(engine.getState().timer?.durationSeconds).toBe(75);
    expect(engine.getState().modifierState?.id).toBe("double-trouble");
  });

  it("loses a timed round when the timer reaches zero", () => {
    const engine = createTestEngine({
      mode: "ultra",
      words: [
        {
          id: "hard-movie",
          answer: "INCEPTION",
          displayAnswer: "Inception",
          genre: "movies",
          difficulty: "hard",
        },
      ],
    });

    const result = engine.advanceTime(60);
    expect(result.state.status).toBe("lost");
    expect(result.state.timer?.remainingSeconds).toBe(0);
    expect(result.events.filter((event) => event.type === "STATUS_CHANGED")).toHaveLength(1);
    expect(engine.guessLetter("i").outcome).toBe("round-complete");
  });

  it("restores an active round without trusting stale calculated fields", () => {
    const original = createTestEngine({
      mode: "ultra",
      words: [
        {
          id: "restorable-movie",
          answer: "INCEPTION",
          displayAnswer: "Inception",
          genre: "movies",
          difficulty: "hard",
        },
      ],
    });
    original.guessLetter("i");
    original.guessLetter("z");
    original.advanceTime(9);
    const serialized = JSON.parse(JSON.stringify(original.getState())) as GameState;
    const restoredEngine = createTestEngine({
      mode: "ultra",
      words: [
        {
          id: "restorable-movie",
          answer: "INCEPTION",
          displayAnswer: "Inception",
          genre: "movies",
          difficulty: "hard",
        },
      ],
    });

    const restored = restoredEngine.restoreRound({ ...serialized, maskedAnswer: "tampered" });

    expect(restored.maskedAnswer).toBe("I_____i__");
    expect(restored.incorrectLetters).toEqual(["Z"]);
    expect(restored.remainingAttempts).toBe(4);
    expect(restored.timer?.remainingSeconds).toBe(46);
    expect(restoredEngine.guessLetter("n").outcome).toBe("correct");
  });

  it("resets the same round and starts a new round with another word", () => {
    const engine = createTestEngine();
    const first = engine.getState();
    engine.guessLetter("z");
    const reset = engine.resetRound();

    expect(reset.roundId).toBe(first.roundId);
    expect(reset.word.id).toBe(first.word.id);
    expect(reset.guessedLetters).toEqual([]);
    expect(reset.remainingAttempts).toBe(reset.maximumAttempts);

    const next = engine.startNewRound();
    expect(next.roundNumber).toBe(2);
    expect(next.roundId).toBe("round-2");
    expect(next.word.id).not.toBe(first.word.id);
  });
});

describe("Ultra Max modifier runtime", () => {
  const connectedWords = [
    {
      id: "connected-alpha",
      answer: "ALPHA",
      displayAnswer: "Alpha",
      genre: "general-knowledge",
      difficulty: "hard",
      metadata: { connectionId: "greek" },
    },
    {
      id: "connected-omega",
      answer: "OMEGA",
      displayAnswer: "Omega",
      genre: "general-knowledge",
      difficulty: "brutal",
      metadata: { connectionId: "greek" },
    },
  ] as const satisfies readonly WordEntry[];

  it("hides Memory letters after four seconds without forgetting solved letters", () => {
    const engine = createTestEngine({
      mode: "ultra-max",
      words: connectedWords,
      initialWordId: "connected-alpha",
      random: () => 0,
    });
    engine.beginRound();

    const guess = engine.guessLetter("a");
    expect(getVisibleAnswers(guess.state).primary).toBe("A___a");
    expect(engine.advanceTime(3.9).state.maskedAnswer).toBe("A___a");

    const expired = engine.advanceTime(0.2).state;
    expect(getVisibleAnswers(expired).primary).toBe("_____");
    expect(expired.maskedAnswer).toBe("A___a");
    expect(expired.guessedLetters).toContain("A");
    engine.guessLetter("l");
    engine.guessLetter("p");
    const allLettersFound = engine.guessLetter("h");
    expect(allLettersFound.state.maskedAnswer).toBe("Alpha");
    expect(allLettersFound.state.status).toBe("playing");
    expect(engine.solveWord("alpha").state.status).toBe("won");
  });

  it("keeps Hidden Length ambiguous until the first correct guess", () => {
    const engine = createTestEngine({
      mode: "ultra-max",
      words: connectedWords,
      initialWordId: "connected-alpha",
      random: () => 0.21,
    });
    expect(getVisibleAnswers(engine.getState()).primary).toBe("???????????");
    engine.beginRound();
    expect(getVisibleAnswers(engine.guessLetter("z").state).primary).toBe("???????????");
    expect(getVisibleAnswers(engine.guessLetter("a").state).primary).toBe("A___a");
  });

  it("visually forgets Keyboard Amnesia mistakes while retaining validation", () => {
    const engine = createTestEngine({
      mode: "ultra-max",
      words: connectedWords,
      initialWordId: "connected-alpha",
      random: () => 0.41,
    });
    engine.beginRound();
    const mistake = engine.guessLetter("z").state;
    expect(getVisibleIncorrectLetters(mistake)).toEqual(["Z"]);

    const forgotten = engine.advanceTime(3.1).state;
    expect(getVisibleIncorrectLetters(forgotten)).toEqual([]);
    expect(getForgottenIncorrectLetters(forgotten)).toEqual(["Z"]);
    expect(engine.guessLetter("z").outcome).toBe("already-guessed");
  });

  it("requires both connected Double Trouble answers and adds thirty seconds", () => {
    const randomValues = [0.81, 0];
    const engine = createTestEngine({
      mode: "ultra-max",
      words: connectedWords,
      initialWordId: "connected-alpha",
      random: () => randomValues.shift() ?? 0,
    });
    expect(engine.getState().timer?.durationSeconds).toBe(75);
    expect(getSecondaryWord(engine.getState())?.id).toBe("connected-omega");
    engine.beginRound();

    const first = engine.solveWord("alpha");
    expect(first.state.status).toBe("playing");
    expect(first.state.modifierState).toMatchObject({
      id: "double-trouble",
      solvedWordIds: ["connected-alpha"],
    });

    const second = engine.solveWord("omega");
    expect(second.state.status).toBe("won");
  });
});
