import { placeholderAsset } from "./define-asset";
import type { UiAssetConfig } from "./types";

export const UI_ASSETS = {
  logo: placeholderAsset("/assets/ui/logo.svg", "H", "Hangman logo"),
  soundEffects: {
    "button-click": "/audio/ui/button-press.ogg",
    "correct-letter": "/audio/ui/correct-guess.ogg",
    "incorrect-letter": "/audio/ui/incorrect-guess.ogg",
    hint: "/audio/ui/hint.ogg",
    win: "/audio/ui/round-won.ogg",
    lose: "/audio/ui/round-lost.ogg",
  },
} as const satisfies UiAssetConfig;
