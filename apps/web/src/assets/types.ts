import type { CategoryId, GameModeId } from "@hangman/game-core";
import type { AudioCue } from "@hangman/shared";

export type AssetFit = "contain" | "cover";

/**
 * A platform-owned visual asset slot. Keep `src` null while using the built-in
 * placeholder, then point it at `replacementPath` when the real file is added.
 */
export interface VisualAssetSlot {
  src: string | null;
  replacementPath: string;
  alt: string;
  placeholderLabel: string;
  fit: AssetFit;
}

export const WRONG_GUESS_ASSET_KEYS = [
  "wrongGuess01",
  "wrongGuess02",
  "wrongGuess03",
  "wrongGuess04",
  "wrongGuess05",
  "wrongGuess06",
  "wrongGuess07",
] as const;

export type WrongGuessAssetKey = (typeof WRONG_GUESS_ASSET_KEYS)[number];
export type GameArtworkAssetKey = "idle" | WrongGuessAssetKey | "win" | "lose";

export interface GameThemeAssetConfig {
  id: string;
  name: string;
  background: VisualAssetSlot;
  logo: VisualAssetSlot;
  idle: VisualAssetSlot;
  wrongGuess01: VisualAssetSlot;
  wrongGuess02: VisualAssetSlot;
  wrongGuess03: VisualAssetSlot;
  wrongGuess04: VisualAssetSlot;
  wrongGuess05: VisualAssetSlot;
  wrongGuess06: VisualAssetSlot;
  wrongGuess07: VisualAssetSlot;
  win: VisualAssetSlot;
  lose: VisualAssetSlot;
}

export type ParticleTreatment = "none" | "calm-dust" | "energy-lines" | "danger-static";

export interface ModeUiTreatment {
  accent: string;
  danger: string;
  surfaceTint: string;
  intensity: "calm" | "charged" | "volatile";
}

export interface ModeAssetConfig {
  modeId: GameModeId;
  background?: VisualAssetSlot;
  particleTreatment?: ParticleTreatment;
  soundEffects?: Partial<Readonly<Record<AudioCue, string>>>;
  uiTreatment?: Readonly<ModeUiTreatment>;
}

export interface CategoryAssetConfig {
  categoryId: CategoryId;
  artwork: VisualAssetSlot;
  accent: string;
  background: string;
  code: string;
}

export interface UiAssetConfig {
  logo: VisualAssetSlot;
  soundEffects: Partial<Readonly<Record<AudioCue, string>>>;
}
