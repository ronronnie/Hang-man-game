import type { GameState } from "./game-state";

export type ModifierId = string;

export interface ModifierDefinition {
  id: ModifierId;
  label: string;
  description: string;
  compatibleModes: readonly ["ultra-max"];
}

export interface ActiveModifier {
  id: ModifierId;
  activatedAtTurn: number;
  metadata?: Readonly<Record<string, boolean | number | string>>;
}

export type ModifierPredicate = (state: Readonly<GameState>) => boolean;
