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

export const ULTRA_URGENCY_THRESHOLDS = [30, 15, 10, 5] as const;

export type UltraUrgencyThreshold = (typeof ULTRA_URGENCY_THRESHOLDS)[number];
export type UltraUrgencyLevel = "steady" | "alert" | "urgent" | "critical" | "final";

export function getUltraComboMultiplier(consecutiveCorrectGuesses: number): number {
  if (consecutiveCorrectGuesses >= 5) return 2.5;
  if (consecutiveCorrectGuesses >= 4) return 2;
  if (consecutiveCorrectGuesses >= 3) return 1.5;
  if (consecutiveCorrectGuesses >= 2) return 1.2;
  return 1;
}

export function getUltraUrgencyLevel(remainingSeconds: number): UltraUrgencyLevel {
  if (remainingSeconds <= 5) return "final";
  if (remainingSeconds <= 10) return "critical";
  if (remainingSeconds <= 15) return "urgent";
  if (remainingSeconds <= 30) return "alert";
  return "steady";
}

export function getCrossedUltraUrgencyThreshold(
  previousSeconds: number,
  currentSeconds: number,
): UltraUrgencyThreshold | null {
  const crossed = ULTRA_URGENCY_THRESHOLDS.filter(
    (threshold) => previousSeconds > threshold && currentSeconds <= threshold,
  );
  return crossed.at(-1) ?? null;
}
