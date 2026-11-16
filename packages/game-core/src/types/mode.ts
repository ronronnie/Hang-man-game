export const GAME_MODE_IDS = ["i-know-this-game", "ultra", "ultra-max"] as const;

export type GameModeId = (typeof GAME_MODE_IDS)[number];

/** Public game-domain name. `GameModeId` remains as a backwards-compatible alias. */
export type GameMode = GameModeId;

export interface GameModeDefinition {
  id: GameModeId;
  label: string;
  description: string;
  ruleset: "standard" | "ultra" | "ultra-max";
}
