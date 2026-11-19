import { describe, expect, it } from "vitest";

import {
  getCrossedUltraUrgencyThreshold,
  getUltraComboMultiplier,
  getUltraUrgencyLevel,
} from "./ultra-policy";

describe("Ultra policy", () => {
  it("uses the configured combo ladder", () => {
    expect([0, 1, 2, 3, 4, 5, 8].map(getUltraComboMultiplier)).toEqual([
      1,
      1,
      1.2,
      1.5,
      2,
      2.5,
      2.5,
    ]);
  });

  it("progresses urgency at 30, 15, 10, and 5 seconds", () => {
    expect(getUltraUrgencyLevel(31)).toBe("steady");
    expect(getUltraUrgencyLevel(30)).toBe("alert");
    expect(getUltraUrgencyLevel(15)).toBe("urgent");
    expect(getUltraUrgencyLevel(10)).toBe("critical");
    expect(getUltraUrgencyLevel(5)).toBe("final");
  });

  it("returns only the most urgent threshold crossed by one update", () => {
    expect(getCrossedUltraUrgencyThreshold(31, 29)).toBe(30);
    expect(getCrossedUltraUrgencyThreshold(16, 9)).toBe(10);
    expect(getCrossedUltraUrgencyThreshold(4, 3)).toBeNull();
  });
});
