import type { MemoryModifierConfig, ModifierDefinitionFor } from "../../types/modifier";
import { GAME_COPY } from "../../config/copy";

export function createMemoryModifier(
  config: Partial<MemoryModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"memory"> {
  return Object.freeze({
    id: "memory",
    label: GAME_COPY.modifiers.memory.label,
    description: GAME_COPY.modifiers.memory.description,
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({ revealedLetterVisibleSeconds: 4, ...config }),
  });
}

export const MEMORY_MODIFIER = createMemoryModifier();
