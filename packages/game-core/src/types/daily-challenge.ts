import type { GameModeId } from "./mode";
import type { ModifierId } from "./modifier";
import type { WordId } from "./word";

export interface DailyChallenge {
  date: string;
  seed: string;
  wordId: WordId;
  modeId: GameModeId;
  modifierIds: readonly ModifierId[];
}

export interface DailyChallengeGenerator {
  generate(date: string): DailyChallenge;
}
