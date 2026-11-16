export type HintId = string;

export interface HintDefinition {
  id: HintId;
  kind: "text" | "reveal-letter" | "remove-letters";
  text?: string;
  cost: number;
}

export interface HintState {
  usedHintIds: readonly HintId[];
  remaining: number;
}

export type HintCostOption = "none" | "score" | "time";

export interface HintModeRules {
  enabled: boolean;
  freeHints: number;
  reducesFinalScore: boolean;
  costOptions: readonly HintCostOption[];
}
