import type { GameModeDefinition, GameModeId } from "../types/mode";

export const GAME_MODES = [
  {
    id: "i-know-this-game",
    label: "I Know This Game",
    description: "The familiar word-guessing experience.",
    ruleset: "standard",
  },
  {
    id: "ultra",
    label: "Ultra",
    description: "An expanded ruleset for a more dynamic challenge.",
    ruleset: "ultra",
  },
  {
    id: "ultra-max",
    label: "Ultra Max",
    description: "The most demanding mode, with additional modifiers.",
    ruleset: "ultra-max",
  },
] as const satisfies readonly GameModeDefinition[];

export const GAME_MODES_BY_ID: Readonly<Record<GameModeId, GameModeDefinition>> = Object.fromEntries(
  GAME_MODES.map((mode) => [mode.id, mode]),
) as unknown as Readonly<Record<GameModeId, GameModeDefinition>>;
