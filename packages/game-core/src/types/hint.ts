export const HINT_KINDS = ["text-clue", "reveal-letter", "show-category"] as const;

export type HintKind = (typeof HINT_KINDS)[number];
export type HintId = string;

export type HintCost =
  | { type: "none" }
  | { type: "score-percent"; percent: number }
  | { type: "time"; seconds: number }
  | { type: "attempt"; attempts: number };

export type HintCostOption = HintCost["type"];

export interface HintRule {
  kind: HintKind;
  label: string;
  description: string;
  cost: HintCost;
  requiresConfirmation: boolean;
}

/** A round-specific hint option ready to be presented by any client. */
export interface HintDefinition extends HintRule {
  id: HintId;
}

export interface AppliedHint {
  id: HintId;
  kind: HintKind;
  cost: HintCost;
  revealedLetter?: string;
}

export interface HintState {
  usedHintIds: readonly HintId[];
  usages: readonly AppliedHint[];
  remaining: number;
}

export interface HintModeRules {
  enabled: boolean;
  /** Shared allowance across all configured options. Zero means each option may be used once. */
  freeHints: number;
  options: readonly HintRule[];
}
