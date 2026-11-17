import { describe, expect, it } from "vitest";

import type { WordEntry } from "../types/word";
import { maskAnswer, normalizeAnswer } from "./answer";
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
    expect(state.modifiers).toHaveLength(1);
    expect(state.modifiers[0]?.id).toBe("time-attack");
    expect(state.timer?.rateMultiplier).toBe(1.5);

    const result = engine.advanceTime(10);
    expect(result.consumedSeconds).toBe(15);
    expect(result.state.timer?.remainingSeconds).toBe(30);
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
      ],
    });

    expect(engine.getState().modifiers[0]?.id).toBe("memory");
    expect(engine.resetRound().modifiers[0]?.id).toBe("memory");
    expect(engine.startNewRound().modifiers).toHaveLength(1);
    expect(engine.getState().modifiers[0]?.id).toBe("double-trouble");
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
    expect(engine.guessLetter("i").outcome).toBe("round-complete");
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
