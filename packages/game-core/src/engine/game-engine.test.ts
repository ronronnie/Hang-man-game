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
    difficulty: 2,
    hint: "A caped crusader",
  },
  {
    id: "gta",
    answer: "GRAND THEFT AUTO",
    displayAnswer: "Grand Theft Auto",
    genre: "video-games",
    difficulty: 2,
  },
  {
    id: "manchester-united",
    answer: "MANCHESTER UNITED",
    displayAnswer: "Manchester United",
    genre: "sports",
    difficulty: 3,
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
  it("selects deterministically by genre and difficulty", () => {
    expect(selectWord(words, { genre: "sports", difficulty: 3, randomValue: 0 })?.id).toBe(
      "manchester-united",
    );
    expect(selectWord(words, { genre: "movies", difficulty: 5, randomValue: 0 })).toBeNull();
  });

  it("supports Surprise Me and exclusions", () => {
    expect(
      selectWord(words, { genre: "surprise-me", excludeWordIds: ["dark-knight"], randomValue: 0 })?.id,
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
    const state = createTestEngine({ genre: "movies", maximumAttempts: 7 }).getState();

    expect(state.status).toBe("playing");
    expect(state.maskedAnswer).toBe("___ ____ ______");
    expect(state.remainingAttempts).toBe(7);
    expect(state.guessedLetters).toEqual([]);
  });

  it("tracks correct, incorrect, and duplicate letter guesses", () => {
    const engine = createTestEngine({ genre: "movies" });
    const correct = engine.guessLetter("t");
    const incorrect = engine.guessLetter("z");
    const duplicate = engine.guessLetter("T");

    expect(correct.outcome).toBe("correct");
    expect(correct.newlyRevealed).toBe(2);
    expect(correct.state.maskedAnswer).toBe("T__ ____ _____t");
    expect(incorrect.outcome).toBe("incorrect");
    expect(incorrect.state.remainingAttempts).toBe(5);
    expect(incorrect.state.incorrectLetters).toEqual(["Z"]);
    expect(duplicate.outcome).toBe("already-guessed");
    expect(duplicate.state.turn).toBe(2);
    expect(duplicate.state.remainingAttempts).toBe(5);
  });

  it("does not consume an attempt for invalid guesses", () => {
    const engine = createTestEngine({ genre: "movies" });
    expect(engine.guessLetter("AB").outcome).toBe("invalid");
    expect(engine.guessLetter("-").outcome).toBe("invalid");
    expect(engine.getState().remainingAttempts).toBe(6);
  });

  it("wins when every guessable character is revealed", () => {
    const engine = createTestEngine({
      words: [
        {
          id: "a-a",
          answer: "A A",
          displayAnswer: "A-A",
          genre: "general-knowledge",
          difficulty: 1,
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
          difficulty: 1,
        },
      ],
    });

    engine.guessLetter("a");
    const result = engine.guessLetter("b");
    expect(result.state.status).toBe("won");
    expect(result.state.maskedAnswer).toBe("A_B");
  });

  it("loses when no attempts remain", () => {
    const engine = createTestEngine({ genre: "movies", maximumAttempts: 2 });
    engine.guessLetter("z");
    const result = engine.guessLetter("q");

    expect(result.state.status).toBe("lost");
    expect(result.state.remainingAttempts).toBe(0);
    expect(engine.guessLetter("x").outcome).toBe("round-complete");
  });

  it("solves a full phrase without requiring matching punctuation or case", () => {
    const engine = createTestEngine({ genre: "video-games" });
    const result = engine.solveWord("grand-theft auto!");

    expect(result.correct).toBe(true);
    expect(result.state.status).toBe("won");
    expect(result.state.maskedAnswer).toBe("Grand Theft Auto");
  });

  it("charges one attempt for an incorrect full-word solve", () => {
    const engine = createTestEngine({ genre: "sports" });
    const result = engine.solveWord("Manchester City");

    expect(result.outcome).toBe("incorrect");
    expect(result.attemptsConsumed).toBe(1);
    expect(result.state.remainingAttempts).toBe(5);
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
