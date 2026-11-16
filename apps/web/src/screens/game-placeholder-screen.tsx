import {
  CATEGORIES_BY_ID,
  GAME_MODES_BY_ID,
  type CategoryId,
  type GameModeId,
} from "@hangman/game-core";

import { PlaceholderCard } from "@/components/ui/placeholder-card";

interface GamePlaceholderScreenProps {
  modeId: GameModeId;
  genreId: CategoryId;
}

export function GamePlaceholderScreen({ modeId, genreId }: GamePlaceholderScreenProps) {
  return (
    <PlaceholderCard
      title={`${GAME_MODES_BY_ID[modeId].label} · ${CATEGORIES_BY_ID[genreId].name}`}
      description="This route is ready for the future game session UI. It deliberately does not contain game rules or state transitions."
    />
  );
}
