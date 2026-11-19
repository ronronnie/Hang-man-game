import { GAME_COPY } from "@hangman/game-core";

import { PlaceholderCard } from "@/components/ui/placeholder-card";

export function SettingsScreen() {
  return (
    <PlaceholderCard
      title={GAME_COPY.placeholders.settings.title}
      description={GAME_COPY.placeholders.settings.description}
    />
  );
}
