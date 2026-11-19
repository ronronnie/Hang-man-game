import type { GameModeId } from "@hangman/game-core";

import { placeholderAsset } from "./define-asset";
import type { ModeAssetConfig } from "./types";

export const MODE_ASSETS = {
  "i-know-this-game": {
    modeId: "i-know-this-game",
    background: placeholderAsset(
      "/assets/modes/i-know-this-game/background.webp",
      "Classic mode background",
      "Calm classic-mode background",
      "cover",
    ),
    particleTreatment: "calm-dust",
    uiTreatment: {
      accent: "#c6ff4a",
      danger: "#ff6b72",
      surfaceTint: "#11151c",
      intensity: "calm",
    },
  },
  ultra: {
    modeId: "ultra",
    background: placeholderAsset(
      "/assets/modes/ultra/background.webp",
      "Ultra mode background",
      "Energetic Ultra-mode background",
      "cover",
    ),
    particleTreatment: "energy-lines",
    uiTreatment: {
      accent: "#c6ff4a",
      danger: "#ff5c65",
      surfaceTint: "#14180f",
      intensity: "charged",
    },
  },
  "ultra-max": {
    modeId: "ultra-max",
    background: placeholderAsset(
      "/assets/modes/ultra-max/background.webp",
      "Ultra Max mode background",
      "Dangerous Ultra Max background",
      "cover",
    ),
    particleTreatment: "danger-static",
    uiTreatment: {
      accent: "#ffcf4a",
      danger: "#ff4c57",
      surfaceTint: "#180d11",
      intensity: "volatile",
    },
  },
} as const satisfies Readonly<Record<GameModeId, ModeAssetConfig>>;

export function getModeAssets(modeId: GameModeId): ModeAssetConfig {
  return MODE_ASSETS[modeId];
}
