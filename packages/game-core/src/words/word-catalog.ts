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
  INDIA_BOOK_WORDS,
  INDIA_GENERAL_KNOWLEDGE_WORDS,
  INDIA_GEOGRAPHY_WORDS,
  INDIA_MOVIE_WORDS,
  INDIA_MUSIC_WORDS,
  INDIA_SCIENCE_WORDS,
  INDIA_SPORTS_WORDS,
  INDIA_TV_SHOW_WORDS,
  INDIA_VIDEO_GAME_WORDS,
} from "./data/index";

export type { WordDifficulty, WordEntry, WordQuery, WordRepository } from "../types/word";
export * from "./region-filter";
export * from "./content-report";
export * from "./data/index";

export const LOCAL_WORDS_BY_GENRE: Readonly<
  Record<PlayableCategoryId, readonly WordEntry[]>
> = Object.freeze({
  movies: Object.freeze([...MOVIE_WORDS, ...INDIA_MOVIE_WORDS]),
  "tv-shows": Object.freeze([...TV_SHOW_WORDS, ...INDIA_TV_SHOW_WORDS]),
  music: Object.freeze([...MUSIC_WORDS, ...INDIA_MUSIC_WORDS]),
  "video-games": Object.freeze([...VIDEO_GAME_WORDS, ...INDIA_VIDEO_GAME_WORDS]),
  sports: Object.freeze([...SPORTS_WORDS, ...INDIA_SPORTS_WORDS]),
  geography: Object.freeze([...GEOGRAPHY_WORDS, ...INDIA_GEOGRAPHY_WORDS]),
  science: Object.freeze([...SCIENCE_WORDS, ...INDIA_SCIENCE_WORDS]),
  books: Object.freeze([...BOOK_WORDS, ...INDIA_BOOK_WORDS]),
  "general-knowledge": Object.freeze([...GENERAL_KNOWLEDGE_WORDS, ...INDIA_GENERAL_KNOWLEDGE_WORDS]),
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
  ...INDIA_MOVIE_WORDS,
  ...INDIA_TV_SHOW_WORDS,
  ...INDIA_MUSIC_WORDS,
  ...INDIA_VIDEO_GAME_WORDS,
  ...INDIA_SPORTS_WORDS,
  ...INDIA_GEOGRAPHY_WORDS,
  ...INDIA_SCIENCE_WORDS,
  ...INDIA_BOOK_WORDS,
  ...INDIA_GENERAL_KNOWLEDGE_WORDS,
]);
