import type { PlayableCategoryId } from "../types/category";
import type { WordEntry } from "../types/word";
import {
  BOOK_WORDS,
  GENERAL_KNOWLEDGE_WORDS,
  GEOGRAPHY_WORDS,
  MOVIE_WORDS,
  MUSIC_WORDS,
  SCIENCE_WORDS,
  SPORTS_WORDS,
  TV_SHOW_WORDS,
  VIDEO_GAME_WORDS,
} from "./data/index";

export type { WordDifficulty, WordEntry, WordQuery, WordRepository } from "../types/word";
export * from "./data/index";

export const LOCAL_WORDS_BY_GENRE: Readonly<
  Record<PlayableCategoryId, readonly WordEntry[]>
> = Object.freeze({
  movies: MOVIE_WORDS,
  "tv-shows": TV_SHOW_WORDS,
  music: MUSIC_WORDS,
  "video-games": VIDEO_GAME_WORDS,
  sports: SPORTS_WORDS,
  geography: GEOGRAPHY_WORDS,
  science: SCIENCE_WORDS,
  books: BOOK_WORDS,
  "general-knowledge": GENERAL_KNOWLEDGE_WORDS,
});

export const LOCAL_WORD_DATASET: readonly WordEntry[] = Object.freeze([
  ...MOVIE_WORDS,
  ...TV_SHOW_WORDS,
  ...MUSIC_WORDS,
  ...VIDEO_GAME_WORDS,
  ...SPORTS_WORDS,
  ...GEOGRAPHY_WORDS,
  ...SCIENCE_WORDS,
  ...BOOK_WORDS,
  ...GENERAL_KNOWLEDGE_WORDS,
]);
