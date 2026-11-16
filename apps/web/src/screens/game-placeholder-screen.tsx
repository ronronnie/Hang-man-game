import { GAME_MODES_BY_ID, GENRES_BY_ID, type GameModeId, type GenreId } from "@hangman/game-core";

import { PlaceholderCard } from "@/components/ui/placeholder-card";

interface GamePlaceholderScreenProps {
  modeId: GameModeId;
  genreId: GenreId;
}

export function GamePlaceholderScreen({ modeId, genreId }: GamePlaceholderScreenProps) {
  return (
    <PlaceholderCard
      title={`${GAME_MODES_BY_ID[modeId].label} · ${GENRES_BY_ID[genreId].label}`}
      description="This route is ready for the future game session UI. It deliberately does not contain game rules or state transitions."
    />
  );
}
