import type { HiddenLengthModifierConfig, ModifierDefinitionFor } from "../../types/modifier";
import { GAME_COPY } from "../../config/copy";

export function createHiddenLengthModifier(
  config: Partial<HiddenLengthModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"hidden-length"> {
  return Object.freeze({
    id: "hidden-length",
    label: GAME_COPY.modifiers["hidden-length"].label,
    description: GAME_COPY.modifiers["hidden-length"].description,
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({
      revealAfterFirstCorrectGuess: true,
      placeholderLength: 11,
      ...config,
    }),
  });
}

export const HIDDEN_LENGTH_MODIFIER = createHiddenLengthModifier();
