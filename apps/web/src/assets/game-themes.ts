import type { GameStatus } from "@hangman/game-core";

import { placeholderAsset } from "./define-asset";
import {
  WRONG_GUESS_ASSET_KEYS,
  type GameArtworkAssetKey,
  type GameThemeAssetConfig,
  type VisualAssetSlot,
} from "./types";

export const DEFAULT_GAME_THEME_ID = "default";

const defaultThemeRoot = "/assets/game/default";

export const GAME_THEMES = {
  default: {
    id: DEFAULT_GAME_THEME_ID,
    name: "Default",
    background: placeholderAsset(
      `${defaultThemeRoot}/background.webp`,
      "Game background",
      "Game scene background",
      "cover",
    ),
    logo: placeholderAsset(`${defaultThemeRoot}/logo.svg`, "H", "Hangman theme logo"),
    idle: placeholderAsset(`${defaultThemeRoot}/idle.webp`, "Idle", "Character waiting for the first guess"),
    wrongGuess01: placeholderAsset(`${defaultThemeRoot}/wrong-guess-01.webp`, "Wrong guess 01", "Character after one wrong guess"),
    wrongGuess02: placeholderAsset(`${defaultThemeRoot}/wrong-guess-02.webp`, "Wrong guess 02", "Character after two wrong guesses"),
    wrongGuess03: placeholderAsset(`${defaultThemeRoot}/wrong-guess-03.webp`, "Wrong guess 03", "Character after three wrong guesses"),
    wrongGuess04: placeholderAsset(`${defaultThemeRoot}/wrong-guess-04.webp`, "Wrong guess 04", "Character after four wrong guesses"),
    wrongGuess05: placeholderAsset(`${defaultThemeRoot}/wrong-guess-05.webp`, "Wrong guess 05", "Character after five wrong guesses"),
    wrongGuess06: placeholderAsset(`${defaultThemeRoot}/wrong-guess-06.webp`, "Wrong guess 06", "Character after six wrong guesses"),
    wrongGuess07: placeholderAsset(`${defaultThemeRoot}/wrong-guess-07.webp`, "Wrong guess 07", "Character after seven wrong guesses"),
    win: placeholderAsset(`${defaultThemeRoot}/win.webp`, "Victory", "Victory artwork"),
    lose: placeholderAsset(`${defaultThemeRoot}/lose.webp`, "Defeat", "Defeat artwork"),
  },
} as const satisfies Readonly<Record<string, GameThemeAssetConfig>>;

export function getGameTheme(themeId = DEFAULT_GAME_THEME_ID): GameThemeAssetConfig {
  return GAME_THEMES[themeId as keyof typeof GAME_THEMES] ?? GAME_THEMES.default;
}

export function resolveGameArtwork(
  theme: GameThemeAssetConfig,
  status: GameStatus,
  incorrectGuesses: number,
  maximumIncorrectGuesses: number,
): { asset: VisualAssetSlot; key: GameArtworkAssetKey } {
  if (status === "won") return { asset: theme.win, key: "win" };
  if (status === "lost") return { asset: theme.lose, key: "lose" };

  const stage = getWrongGuessStage(incorrectGuesses, maximumIncorrectGuesses);
  if (stage === 0) return { asset: theme.idle, key: "idle" };

  const key = WRONG_GUESS_ASSET_KEYS[stage - 1];
  return { asset: theme[key], key };
}

export function getWrongGuessStage(
  incorrectGuesses: number,
  maximumIncorrectGuesses: number,
): number {
  if (!Number.isFinite(maximumIncorrectGuesses) || maximumIncorrectGuesses <= 0) return 0;
  const safeIncorrectGuesses = Math.min(
    maximumIncorrectGuesses,
    Math.max(0, incorrectGuesses),
  );
  if (safeIncorrectGuesses === 0) return 0;
  return Math.ceil((safeIncorrectGuesses / maximumIncorrectGuesses) * WRONG_GUESS_ASSET_KEYS.length);
}
