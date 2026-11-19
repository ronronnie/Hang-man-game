import { describe, expect, it } from "vitest";

import { createGameEngine } from "../engine/game-engine";
import type { WordEntry } from "../types/word";
import { parseScoreBreakdown } from "./scoring-policy";

const easyWord: WordEntry = {
  id: "scoring-easy",
  answer: "PLANET",
  displayAnswer: "Planet",
  genre: "science",
  difficulty: "easy",
  hint: "A world orbiting a star",
};

function createScoringEngine(
  overrides: Partial<Parameters<typeof createGameEngine>[0]> = {},
) {
  return createGameEngine({ words: [easyWord], random: () => 0, ...overrides });
}

describe("scoring policy", () => {
  it("awards transparent Perfect Solve and early full-answer bonuses", () => {
    const result = createScoringEngine().solveWord("planet");
    const score = result.state.score;

    expect(score).toMatchObject({
      modeMultiplier: 1,
      difficultyMultiplier: 1,
      wrongGuesses: 0,
      hintsUsed: 0,
      perfectSolve: true,
      earlySolve: true,
      clutch: false,
    });
    expect(score.wordLength).toBe(6);
    expect(score.wordLengthBonus).toBeGreaterThan(0);
    expect(score.perfectSolveBonus).toBeGreaterThan(0);
    expect(score.earlySolveBonus).toBeGreaterThan(0);
    expect(score.total).toBe(
      score.multipliedScore +
        score.earlySolveBonus +
        score.perfectSolveBonus +
        score.clutchBonus +
        score.modifierBonus -
        score.hintPenalty,
    );
  });

  it("awards Clutch with exactly one attempt remaining", () => {
    const engine = createScoringEngine({ maximumAttempts: 2 });
    engine.guessLetter("z");
    const result = engine.solveWord("planet");

    expect(result.state.remainingAttempts).toBe(1);
    expect(result.state.score).toMatchObject({
      clutch: true,
      perfectSolve: false,
      wrongGuesses: 1,
    });
    expect(result.state.score.clutchBonus).toBeGreaterThan(0);
    expect(result.state.score.accuracyMultiplier).toBeLessThan(1);
  });

  it("awards Clutch below five seconds and exposes the 2x Ultra mode multiplier", () => {
    const engine = createScoringEngine({
      mode: "ultra",
      words: [{ ...easyWord, difficulty: "hard" }],
    });
    engine.advanceTime(56);
    const result = engine.solveWord("planet");

    expect(result.state.timer?.remainingSeconds).toBe(4);
    expect(result.state.score).toMatchObject({
      clutch: true,
      modeMultiplier: 2,
      difficultyMultiplier: 1.6,
    });
    expect(result.state.score.timeBonus).toBeGreaterThan(0);
  });

  it("applies configured hint penalties and disqualifies Perfect Solve", () => {
    const engine = createScoringEngine({
      mode: "ultra",
      words: [{ ...easyWord, difficulty: "hard" }],
    });
    engine.useHint("text-clue");
    const result = engine.solveWord("planet");

    expect(result.state.score).toMatchObject({
      hintsUsed: 1,
      hintPenaltyPercent: 10,
      perfectSolve: false,
    });
    expect(result.state.score.hintPenalty).toBeGreaterThan(0);
  });

  it("round-trips a validated score breakdown for client handoff", () => {
    const score = createScoringEngine().solveWord("planet").state.score;

    expect(parseScoreBreakdown(JSON.stringify(score))).toEqual(score);
    expect(parseScoreBreakdown('{"total":"not-a-number"}')).toBeNull();
  });

  it("provides loss-screen letter and mistake totals", () => {
    const engine = createScoringEngine({ maximumAttempts: 2 });
    engine.guessLetter("p");
    engine.guessLetter("l");
    engine.guessLetter("z");
    const result = engine.guessLetter("q");

    expect(result.state.status).toBe("lost");
    expect(result.state.score).toMatchObject({
      lettersGuessed: 4,
      remainingLetters: 4,
      wrongGuesses: 2,
    });
  });
});
