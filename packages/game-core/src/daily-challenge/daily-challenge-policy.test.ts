import { describe, expect, it } from "vitest";

import { dailyChallengeEnabled } from "../config/features";
import {
  beginDailyChallengeAttempt,
  completeDailyChallengeAttempt,
  createDailyChallengeGenerator,
  createEmptyDailyChallengeHistory,
  getDailyChallengeStatus,
} from "./daily-challenge-policy";

describe("daily challenge generation", () => {
  const generator = createDailyChallengeGenerator();

  it("derives the same challenge from the same date without runtime entropy", () => {
    const first = generator.generate("2026-11-18");
    const second = createDailyChallengeGenerator().generate("2026-11-18");

    expect(second).toEqual(first);
    expect(first.date).toBe("2026-11-18");
    expect(first.words[0]?.id).toBe(first.wordId);
    expect(first.words[0]?.answer).toBe(first.answer);
    expect(first.words[0]?.genre).toBe(first.genreId);
    expect(first.regionPreference).toBe("mixed");
  });

  it("can deterministically scope a challenge to India content", () => {
    const indiaGenerator = createDailyChallengeGenerator({ regionPreference: "india" });
    const challenge = indiaGenerator.generate("2026-11-18");
    expect(challenge.regionPreference).toBe("india");
    expect(challenge.words.every((word) => word.region === "india" || word.region === "global")).toBe(true);
  });

  it("uses a new deterministic seed for a different date", () => {
    expect(generator.generate("2026-11-18").seed).not.toBe(
      generator.generate("2026-11-19").seed,
    );
  });

  it("only assigns modifiers to Ultra Max and fixes both Double Trouble answers", () => {
    const challenges = Array.from({ length: 366 }, (_, day) => {
      const date = new Date(Date.UTC(2026, 0, day + 1)).toISOString().slice(0, 10);
      return generator.generate(date);
    });
    const standardChallenges = challenges.filter(({ modeId }) => modeId !== "ultra-max");
    const ultraMaxChallenges = challenges.filter(({ modeId }) => modeId === "ultra-max");
    const doubleTrouble = ultraMaxChallenges.find(({ modifierId }) => modifierId === "double-trouble");

    expect(standardChallenges.every(({ modifierId }) => modifierId === null)).toBe(true);
    expect(ultraMaxChallenges.every(({ modifierId }) => modifierId !== null)).toBe(true);
    expect(doubleTrouble?.words).toHaveLength(2);
  });

  it("rejects malformed or impossible dates", () => {
    expect(() => generator.generate("18-11-2026")).toThrow(/YYYY-MM-DD/);
    expect(() => generator.generate("2026-02-30")).toThrow(/valid calendar date/);
  });

  it("ships disabled until the release flag is intentionally changed", () => {
    expect(dailyChallengeEnabled).toBe(false);
  });
});

describe("daily challenge attempts", () => {
  const challenge = createDailyChallengeGenerator().generate("2026-11-18");

  it("consumes the official attempt when play begins and never grants a second", () => {
    const empty = createEmptyDailyChallengeHistory();
    const started = beginDailyChallengeAttempt(empty, challenge, "2026-11-18T08:00:00.000Z");
    const retry = beginDailyChallengeAttempt(
      started.history,
      challenge,
      "2026-11-18T08:01:00.000Z",
    );

    expect(started.allowed).toBe(true);
    expect(getDailyChallengeStatus(started.history, challenge.date)).toBe("not-attempted");
    expect(retry).toMatchObject({ allowed: false, reason: "already-attempted" });
  });

  it("records a final win or loss once", () => {
    const started = beginDailyChallengeAttempt(
      createEmptyDailyChallengeHistory(),
      challenge,
      "2026-11-18T08:00:00.000Z",
    );
    const won = completeDailyChallengeAttempt(
      started.history,
      challenge,
      "won",
      "2026-11-18T08:02:00.000Z",
    );
    const overwrite = completeDailyChallengeAttempt(
      won.history,
      challenge,
      "lost",
      "2026-11-18T08:03:00.000Z",
    );

    expect(won.completed).toBe(true);
    expect(getDailyChallengeStatus(won.history, challenge.date)).toBe("won");
    expect(overwrite).toMatchObject({ completed: false, reason: "already-completed" });
  });
});
