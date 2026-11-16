import { describe, expect, it } from "vitest";

import { GAME_MODES_BY_ID } from "./modes";

describe("game mode configuration", () => {
  it("defines traditional mode centrally", () => {
    const rules = GAME_MODES_BY_ID["i-know-this-game"].rules;
    expect(rules.maximumIncorrectGuesses).toBe(7);
    expect(rules.timer).toBeNull();
    expect(rules.guessedLetterVisibility).toBe("persistent");
    expect(rules.categoryVisibility).toBe("always");
    expect(rules.hints.freeHints).toBe(1);
    expect(rules.wordPool.tier).toBe("normal");
    expect(rules.scoreMultiplier).toBe(1);
    expect(rules.modifierSelection).toBeNull();
  });

  it("defines Ultra centrally", () => {
    const rules = GAME_MODES_BY_ID.ultra.rules;
    expect(rules.maximumIncorrectGuesses).toBe(5);
    expect(rules.timer).toMatchObject({ durationSeconds: 60, incorrectGuessPenaltySeconds: 5 });
    expect(rules.categoryVisibility).toBe("always");
    expect(rules.hints).toMatchObject({ enabled: true, reducesFinalScore: true });
    expect(rules.wordPool.tier).toBe("harder");
    expect(rules.scoreMultiplier).toBe(2);
  });

  it("defines Ultra Max centrally", () => {
    const rules = GAME_MODES_BY_ID["ultra-max"].rules;
    expect(rules.maximumIncorrectGuesses).toBe(4);
    expect(rules.timer).toMatchObject({ durationSeconds: 45, incorrectGuessPenaltySeconds: 7 });
    expect(rules.categoryVisibility).toBe("pre-round-only");
    expect(rules.hints.freeHints).toBe(0);
    expect(rules.hints.costOptions).toEqual(["time", "score"]);
    expect(rules.wordPool.tier).toBe("hardest");
    expect(rules.scoreMultiplier).toBe(4);
    expect(rules.supportsPhrases).toBe(true);
    expect(rules.modifierSelection).toMatchObject({ count: 1 });
    expect(rules.modifierSelection?.pool).toHaveLength(5);
  });
});
