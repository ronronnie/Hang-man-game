import type { DoubleTroubleModifierConfig, ModifierDefinitionFor } from "../../types/modifier";

export function createDoubleTroubleModifier(
  config: Partial<DoubleTroubleModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"double-trouble"> {
  return Object.freeze({
    id: "double-trouble",
    label: "Double Trouble",
    description: "The round requires two answers connected by shared metadata.",
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({ answerCount: 2, connectionMetadataKey: "connectionId", ...config }),
  });
}

export const DOUBLE_TROUBLE_MODIFIER = createDoubleTroubleModifier();
