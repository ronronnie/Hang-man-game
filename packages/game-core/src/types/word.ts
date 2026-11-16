import type { Genre } from "./genre";

export type WordId = string;
export type WordDifficulty = 1 | 2 | 3 | 4 | 5;
export type PlayableGenre = Exclude<Genre, "surprise-me">;

export interface WordEntry {
  id: WordId;
  /** Canonical answer used for validation and full-answer guesses. */
  answer: string;
  /** Presentation-safe answer, preserving capitalization and punctuation. */
  displayAnswer: string;
  genre: PlayableGenre;
  difficulty: WordDifficulty;
  hint?: string;
  alternateAnswers?: readonly string[];
  metadata?: Readonly<Record<string, boolean | number | string>>;
}

export interface WordQuery {
  genre: Genre;
  excludeWordIds?: readonly WordId[];
  difficulty?: WordDifficulty;
  minimumDifficulty?: WordDifficulty;
  maximumDifficulty?: WordDifficulty;
}

export interface WordRepository {
  findById(id: WordId): WordEntry | null;
  select(query: WordQuery, randomValue: number): WordEntry | null;
}
