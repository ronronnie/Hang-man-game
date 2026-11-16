import type { GameAction, GameState, GameTransition } from "../types/game-state";

export interface CreateGameOptions {
  gameId: string;
  modeId: GameState["modeId"];
  genreId: GameState["genreId"];
  now: string;
  randomSeed: string;
}

/** Public contract only. The platform-independent implementation is the next phase. */
export interface GameEngine {
  createGame(options: CreateGameOptions): Readonly<GameState>;
  transition(state: Readonly<GameState>, action: GameAction): GameTransition;
}
