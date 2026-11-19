import { describe, expect, it } from "vitest";

import { createEmptyPlayerStatistics, normalizePlayerStatistics, recordCompletedRound } from "./statistics-policy";
import type { CompletedRoundStatistics } from "../types/statistics";

function round(overrides: Partial<CompletedRoundStatistics> = {}): CompletedRoundStatistics {
  return {
    roundId: "round-1",
    mode: "ultra",
    genre: "movies",
    regionPreference: "india",
    outcome: "won",
    score: 4200,
    accuracyPercent: 80,
    wrongGuesses: 1,
    remainingTimeSeconds: 12,
    completedAt: "2026-11-18T00:00:00.000Z",
    ...overrides,
  };
}

describe("player statistics", () => {
  it("updates overall, mode, genre, and region summaries", () => {
    const result = recordCompletedRound(createEmptyPlayerStatistics(), round());

    expect(result.recorded).toBe(true);
    expect(result.statistics.overall).toMatchObject({
      gamesPlayed: 1,
      gamesWon: 1,
      winRate: 100,
      highestScore: 4200,
      currentStreak: 1,
      highestStreak: 1,
      averageAccuracy: 80,
    });
    expect(result.statistics.byMode.ultra.gamesWon).toBe(1);
    expect(result.statistics.byGenre.movies.gamesWon).toBe(1);
    expect(result.statistics.byRegion.india.gamesWon).toBe(1);
  });

  it("migrates schema v1 stats without losing existing totals", () => {
    const current = createEmptyPlayerStatistics();
    const legacy = {
      ...current,
      schemaVersion: 1,
      overall: { ...current.overall, gamesPlayed: 7, gamesWon: 4, highestScore: 9000 },
      byRegion: undefined,
    };
    const migrated = normalizePlayerStatistics(legacy);

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.overall).toMatchObject({ gamesPlayed: 7, gamesWon: 4, highestScore: 9000 });
    expect(migrated.byRegion.mixed.gamesPlayed).toBe(0);
  });

  it("rejects duplicate round ids", () => {
    const first = recordCompletedRound(createEmptyPlayerStatistics(), round());
    const duplicate = recordCompletedRound(first.statistics, round());

    expect(duplicate.recorded).toBe(false);
    expect(duplicate.statistics.overall.gamesPlayed).toBe(1);
  });

  it("unlocks achievements and resets the streak after a loss", () => {
    const perfectWin = recordCompletedRound(
      createEmptyPlayerStatistics(),
      round({ wrongGuesses: 0, remainingTimeSeconds: 4 }),
    );
    const unlockedIds = perfectWin.unlockedAchievements.map(({ definition }) => definition.id);
    expect(unlockedIds).toEqual(
      expect.arrayContaining(["first-blood", "perfect", "ultra-instinct", "clutch"]),
    );

    const loss = recordCompletedRound(
      perfectWin.statistics,
      round({ roundId: "round-2", outcome: "lost" }),
    );
    expect(loss.statistics.overall.currentStreak).toBe(0);
    expect(loss.statistics.overall.gamesPlayed).toBe(2);
  });

  it("unlocks the ten-game streak exactly once", () => {
    let statistics = createEmptyPlayerStatistics();
    let finalUnlocks: readonly string[] = [];

    for (let index = 1; index <= 10; index += 1) {
      const result = recordCompletedRound(
        statistics,
        round({ roundId: `round-${index}`, completedAt: `2026-11-18T00:00:${index}.000Z` }),
      );
      statistics = result.statistics;
      finalUnlocks = result.unlockedAchievements.map(({ definition }) => definition.id);
    }

    expect(statistics.overall.currentStreak).toBe(10);
    expect(finalUnlocks).toContain("ten-in-a-row");
  });
});
