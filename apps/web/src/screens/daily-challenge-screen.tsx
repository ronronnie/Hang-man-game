import { dailyChallengeEnabled, GAME_COPY } from "@hangman/game-core";

import { PlaceholderCard } from "@/components/ui/placeholder-card";

export function DailyChallengeScreen() {
  if (!dailyChallengeEnabled) {
    return (
      <PlaceholderCard
        title={GAME_COPY.placeholders.daily.title}
        description={GAME_COPY.placeholders.daily.description}
      />
    );
  }

  return (
    <PlaceholderCard
      title={GAME_COPY.placeholders.daily.title}
      description="Today’s challenge is ready. The playable flow will connect here when the flag goes live."
    />
  );
}
