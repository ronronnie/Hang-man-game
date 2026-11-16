import { GAME_MODE_IDS, type GameModeId } from "../types/mode";
import { GENRE_IDS, type GenreId } from "../types/genre";

export function isGameModeId(value: string): value is GameModeId {
  return (GAME_MODE_IDS as readonly string[]).includes(value);
}

export function isGenreId(value: string): value is GenreId {
  return (GENRE_IDS as readonly string[]).includes(value);
}
