import { describe, expect, it } from "vitest";

import type { StorageAdapter } from "@hangman/shared";

import {
  DEFAULT_REGION_PREFERENCE,
  loadRegionPreference,
  saveRegionPreference,
} from "./region-preference-storage";

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, unknown>();

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

describe("region preference storage", () => {
  it("persists and restores the latest explicit preference", async () => {
    const storage = new MemoryStorage();
    await saveRegionPreference(storage, "india");
    expect(await loadRegionPreference(storage)).toBe("india");
    await saveRegionPreference(storage, "usa");
    expect(await loadRegionPreference(storage)).toBe("usa");
  });

  it("migrates missing or malformed old values to Mixed", async () => {
    const storage = new MemoryStorage();
    expect(await loadRegionPreference(storage)).toBe(DEFAULT_REGION_PREFERENCE);
    await storage.set("content-region-preference", "somewhere-else");
    expect(await loadRegionPreference(storage)).toBe("mixed");
  });
});
