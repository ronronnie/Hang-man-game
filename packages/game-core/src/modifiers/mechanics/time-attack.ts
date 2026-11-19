import type { ModifierDefinitionFor, TimeAttackModifierConfig } from "../../types/modifier";
import { GAME_COPY } from "../../config/copy";

export function createTimeAttackModifier(
  config: Partial<TimeAttackModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"time-attack"> {
  return Object.freeze({
    id: "time-attack",
    label: GAME_COPY.modifiers["time-attack"].label,
    description: GAME_COPY.modifiers["time-attack"].description,
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({
      timerRateMultiplier: 1.5,
      acceleratedFinalSeconds: 15,
      ...config,
    }),
  });
}

export const TIME_ATTACK_MODIFIER = createTimeAttackModifier();
