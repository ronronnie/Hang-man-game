import { describe, expect, it } from "vitest";

import type { StorageAdapter } from "@hangman/shared";

import { loadRecentWordIds, rememberWord } from "./recent-word-history";

class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | null> {
    return (this.values.get(key) as T | undefined) ?? null;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }
  async remove(key: string): Promise<void> {
    this.values.delete(key);
  }
  async clear(): Promise<void> {
    this.values.clear();
  }
}

describe("recent regional word history", () => {
  it("keeps region rotations isolated and records Surprise Me in the actual genre", async () => {
    const storage = new MemoryStorage();
    await rememberWord(storage, "surprise-me", "india", "movies-india-lagaan", "movies");

    expect(await loadRecentWordIds(storage, "surprise-me", "india")).toEqual([
      "movies-india-lagaan",
    ]);
    expect(await loadRecentWordIds(storage, "movies", "india")).toEqual([
      "movies-india-lagaan",
    ]);
    expect(await loadRecentWordIds(storage, "movies", "usa")).toEqual([]);
  });

  it("migrates the old regionless history into Mixed without losing answers", async () => {
    const storage = new MemoryStorage();
    storage.values.set("recent-words:movies", {
      version: 1,
      wordIds: ["movies-the-matrix"],
    });

    expect(await loadRecentWordIds(storage, "movies", "mixed")).toEqual([
      "movies-the-matrix",
    ]);
    expect(storage.values.has("recent-words:movies")).toBe(false);
  });
});
