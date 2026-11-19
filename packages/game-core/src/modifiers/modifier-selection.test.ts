import { describe, expect, it } from "vitest";

import { getActiveModifier, selectRoundModifier } from "./modifier-selection";
import { createMemoryModifier } from "./mechanics/memory";
import { MODIFIERS_BY_ID, ULTRA_MAX_MODIFIERS, modifierRegistry } from "./registry";

describe("Ultra Max modifier registry", () => {
  it("registers every modifier as an independent configuration", () => {
    expect(modifierRegistry.list().map((modifier) => modifier.id)).toEqual([
      "memory",
      "hidden-length",
      "keyboard-amnesia",
      "time-attack",
      "double-trouble",
    ]);
    expect(MODIFIERS_BY_ID.memory.config.revealedLetterVisibleSeconds).toBe(4);
    expect(MODIFIERS_BY_ID["hidden-length"].config.revealAfterFirstCorrectGuess).toBe(true);
    expect(MODIFIERS_BY_ID["hidden-length"].config.placeholderLength).toBe(11);
    expect(MODIFIERS_BY_ID["keyboard-amnesia"].config.incorrectKeyUnavailableSeconds).toBe(3);
    expect(MODIFIERS_BY_ID["time-attack"].config.timerRateMultiplier).toBe(1.5);
    expect(MODIFIERS_BY_ID["time-attack"].config.acceleratedFinalSeconds).toBe(15);
    expect(MODIFIERS_BY_ID["double-trouble"].config).toMatchObject({
      answerCount: 2,
      connectionMetadataKey: "connectionId",
      timerBonusSeconds: 30,
    });
  });

  it("selects exactly one modifier using injected randomness", () => {
    const pool = modifierRegistry.list().map((modifier) => modifier.id);
    expect(selectRoundModifier(ULTRA_MAX_MODIFIERS, pool, 0)?.id).toBe("memory");
    expect(selectRoundModifier(ULTRA_MAX_MODIFIERS, pool, 0.99)?.id).toBe("double-trouble");
  });

  it("respects a restricted pool without activating every modifier", () => {
    const selected = selectRoundModifier(ULTRA_MAX_MODIFIERS, ["hidden-length"], 0.5);
    expect(selected?.id).toBe("hidden-length");
  });

  it("allows each mechanic to be tuned independently", () => {
    const configured = createMemoryModifier(
      { revealedLetterVisibleSeconds: 6 },
      { selectionWeight: 3 },
    );
    expect(configured.config.revealedLetterVisibleSeconds).toBe(6);
    expect(configured.selectionWeight).toBe(3);
    expect(MODIFIERS_BY_ID.memory.config.revealedLetterVisibleSeconds).toBe(4);
  });

  it("returns the exact typed configuration for an active mechanic", () => {
    const active = selectRoundModifier(ULTRA_MAX_MODIFIERS, ["time-attack"], 0);
    expect(getActiveModifier(active ? [active] : [], "time-attack")?.config.timerRateMultiplier).toBe(
      1.5,
    );
    expect(getActiveModifier(active ? [active] : [], "memory")).toBeNull();
  });
});
