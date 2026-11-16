import type { ModifierDefinition, ModifierId } from "../types/modifier";

export interface ModifierRegistry {
  get(id: ModifierId): ModifierDefinition | null;
  list(): readonly ModifierDefinition[];
}

// Ultra Max modifier definitions intentionally remain unpopulated in this foundation phase.
export const ULTRA_MAX_MODIFIERS: readonly ModifierDefinition[] = [];
