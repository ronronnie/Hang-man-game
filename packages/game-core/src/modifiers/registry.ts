import type {
  ModifierDefinition,
  ModifierDefinitionsById,
  ModifierId,
} from "../types/modifier";
import { DOUBLE_TROUBLE_MODIFIER } from "./mechanics/double-trouble";
import { HIDDEN_LENGTH_MODIFIER } from "./mechanics/hidden-length";
import { KEYBOARD_AMNESIA_MODIFIER } from "./mechanics/keyboard-amnesia";
import { MEMORY_MODIFIER } from "./mechanics/memory";
import { TIME_ATTACK_MODIFIER } from "./mechanics/time-attack";

export interface ModifierRegistry {
  get(id: ModifierId): ModifierDefinition | null;
  list(): readonly ModifierDefinition[];
}

export const ULTRA_MAX_MODIFIERS = Object.freeze([
  MEMORY_MODIFIER,
  HIDDEN_LENGTH_MODIFIER,
  KEYBOARD_AMNESIA_MODIFIER,
  TIME_ATTACK_MODIFIER,
  DOUBLE_TROUBLE_MODIFIER,
]) satisfies readonly ModifierDefinition[];

export const MODIFIERS_BY_ID = Object.freeze(
  Object.fromEntries(ULTRA_MAX_MODIFIERS.map((modifier) => [modifier.id, modifier])),
) as Readonly<ModifierDefinitionsById>;

export const modifierRegistry: ModifierRegistry = Object.freeze({
  get(id: ModifierId) {
    return MODIFIERS_BY_ID[id] ?? null;
  },
  list() {
    return ULTRA_MAX_MODIFIERS;
  },
});
