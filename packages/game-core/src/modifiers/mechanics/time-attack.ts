import type { ModifierDefinitionFor, TimeAttackModifierConfig } from "../../types/modifier";

export function createTimeAttackModifier(
  config: Partial<TimeAttackModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"time-attack"> {
  return Object.freeze({
    id: "time-attack",
    label: "Time Attack",
    description: "The round timer decreases faster than real time.",
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({ timerRateMultiplier: 1.5, ...config }),
  });
}

export const TIME_ATTACK_MODIFIER = createTimeAttackModifier();
