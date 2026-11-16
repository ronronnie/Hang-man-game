import type { PlayableCategoryId } from "./category";

export type WordId = string;
export type WordDifficulty = 1 | 2 | 3 | 4 | 5;
/** @deprecated Prefer `PlayableCategoryId`. */
export type PlayableGenre = PlayableCategoryId;

export interface WordEntry {
  id: WordId;
  /** Canonical answer used for validation and full-answer guesses. */
  answer: string;
  /** Presentation-safe answer, preserving capitalization and punctuation. */
  displayAnswer: string;
  genre: PlayableCategoryId;
  difficulty: WordDifficulty;
  hint?: string;
  alternateAnswers?: readonly string[];
  metadata?: Readonly<Record<string, boolean | number | string>>;
}

export interface WordQuery {
  excludeWordIds?: readonly WordId[];
  difficulty?: WordDifficulty;
  minimumDifficulty?: WordDifficulty;
  maximumDifficulty?: WordDifficulty;
}

export interface WordRepository {
  findById(id: WordId): WordEntry | null;
  select(query: WordQuery, randomValue: number): WordEntry | null;
}
