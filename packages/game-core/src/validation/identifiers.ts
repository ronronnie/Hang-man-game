import { GAME_MODE_IDS, type GameModeId } from "../types/mode";
import {
  CATEGORY_IDS,
  type CategoryId,
  type PlayableCategoryId,
} from "../types/category";
import type { GenreId } from "../types/genre";

export function isGameModeId(value: string): value is GameModeId {
  return (GAME_MODE_IDS as readonly string[]).includes(value);
}

export function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

export function isPlayableCategoryId(value: string): value is PlayableCategoryId {
  return value !== "surprise-me" && isCategoryId(value);
}

/** @deprecated Prefer `isCategoryId`. */
export function isGenreId(value: string): value is GenreId {
  return isCategoryId(value);
}
