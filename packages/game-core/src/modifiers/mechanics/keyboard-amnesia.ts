import type {
  KeyboardAmnesiaModifierConfig,
  ModifierDefinitionFor,
} from "../../types/modifier";
import { GAME_COPY } from "../../config/copy";

export function createKeyboardAmnesiaModifier(
  config: Partial<KeyboardAmnesiaModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"keyboard-amnesia"> {
  return Object.freeze({
    id: "keyboard-amnesia",
    label: GAME_COPY.modifiers["keyboard-amnesia"].label,
    description: GAME_COPY.modifiers["keyboard-amnesia"].description,
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({ incorrectKeyUnavailableSeconds: 3, ...config }),
  });
}

export const KEYBOARD_AMNESIA_MODIFIER = createKeyboardAmnesiaModifier();
