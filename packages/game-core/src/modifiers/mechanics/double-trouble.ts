import type { DoubleTroubleModifierConfig, ModifierDefinitionFor } from "../../types/modifier";
import { GAME_COPY } from "../../config/copy";

export function createDoubleTroubleModifier(
  config: Partial<DoubleTroubleModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"double-trouble"> {
  return Object.freeze({
    id: "double-trouble",
    label: GAME_COPY.modifiers["double-trouble"].label,
    description: GAME_COPY.modifiers["double-trouble"].description,
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({
      answerCount: 2,
      connectionMetadataKey: "connectionId",
      timerBonusSeconds: 30,
      ...config,
    }),
  });
}

export const DOUBLE_TROUBLE_MODIFIER = createDoubleTroubleModifier();
