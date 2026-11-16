import type { MemoryModifierConfig, ModifierDefinitionFor } from "../../types/modifier";

export function createMemoryModifier(
  config: Partial<MemoryModifierConfig> = {},
  options: { enabled?: boolean; selectionWeight?: number } = {},
): ModifierDefinitionFor<"memory"> {
  return Object.freeze({
    id: "memory",
    label: "Memory",
    description: "Correctly revealed letters disappear after a short period.",
    compatibleModes: ["ultra-max"] as const,
    enabled: options.enabled ?? true,
    selectionWeight: options.selectionWeight ?? 1,
    config: Object.freeze({ revealedLetterVisibleSeconds: 4, ...config }),
  });
}

export const MEMORY_MODIFIER = createMemoryModifier();
