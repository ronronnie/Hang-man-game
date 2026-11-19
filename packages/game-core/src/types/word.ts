import type { PlayableCategoryId } from "./category";
import type { ContentRegion } from "./region";

export type WordId = string;
export const WORD_DIFFICULTIES = ["easy", "medium", "hard", "brutal"] as const;
export type WordDifficulty = (typeof WORD_DIFFICULTIES)[number];
/** @deprecated Prefer `PlayableCategoryId`. */
export type PlayableGenre = PlayableCategoryId;

export interface WordEntry {
  id: WordId;
  /** Canonical answer used for validation and full-answer guesses. */
  answer: string;
  /** Presentation-safe answer, preserving capitalization and punctuation. */
  displayAnswer: string;
  genre: PlayableCategoryId;
  /** Legacy entries without a region are migrated as global at content boundaries. */
  region?: ContentRegion;
  difficulty: WordDifficulty;
  hint?: string;
  alternateAnswers?: readonly string[];
  metadata?: Readonly<Record<string, boolean | number | string>>;
}

export interface WordQuery {
  excludeWordIds?: readonly WordId[];
  difficulty?: WordDifficulty;
  difficulties?: readonly WordDifficulty[];
}

export interface WordRepository {
  findById(id: WordId): WordEntry | null;
  select(query: WordQuery, randomValue: number): WordEntry | null;
}
