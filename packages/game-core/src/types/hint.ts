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
