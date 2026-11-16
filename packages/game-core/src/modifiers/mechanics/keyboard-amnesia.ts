import type {
  KeyboardAmnesiaModifierConfig,
  ModifierDefinitionFor,
} from "../../types/modifier";

export function createKeyboardAmnesiaModifier(
  config: Partial<KeyboardAmnesiaModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"keyboard-amnesia"> {
  return Object.freeze({
    id: "keyboard-amnesia",
    label: "Keyboard Amnesia",
    description: "Incorrect keys eventually appear available again on the keyboard.",
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({ incorrectKeyUnavailableSeconds: 8, ...config }),
  });
}

export const KEYBOARD_AMNESIA_MODIFIER = createKeyboardAmnesiaModifier();
