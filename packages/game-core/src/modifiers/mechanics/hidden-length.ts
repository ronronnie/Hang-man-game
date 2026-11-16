import type { HiddenLengthModifierConfig, ModifierDefinitionFor } from "../../types/modifier";

export function createHiddenLengthModifier(
  config: Partial<HiddenLengthModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"hidden-length"> {
  return Object.freeze({
    id: "hidden-length",
    label: "Hidden Length",
    description: "The answer length stays hidden until the first accepted guess.",
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({ revealAfterFirstGuess: true, ...config }),
  });
}

export const HIDDEN_LENGTH_MODIFIER = createHiddenLengthModifier();
