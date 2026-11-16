import type { GenreId } from "./genre";

export type WordId = string;

export interface WordEntry {
  id: WordId;
  answer: string;
  genreId: Exclude<GenreId, "surprise-me">;
  alternateAnswers?: readonly string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  hintIds: readonly string[];
  metadata?: Readonly<Record<string, string>>;
}

export interface WordQuery {
  genreId: GenreId;
  excludeWordIds?: readonly WordId[];
  maximumDifficulty?: WordEntry["difficulty"];
}

export interface WordRepository {
  findById(id: WordId): WordEntry | null;
  select(query: WordQuery, randomValue: number): WordEntry | null;
}
