import type { GameState } from "../types/game-state";

export type UltraMechanicId = string;

export interface UltraMechanicDefinition {
  id: UltraMechanicId;
  label: string;
  description: string;
}

export interface UltraPolicy {
  activeMechanics(state: Readonly<GameState>): readonly UltraMechanicDefinition[];
}
