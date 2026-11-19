import { GAME_COPY, type GameStatus } from "@hangman/game-core";

import { getGameTheme, resolveGameArtwork } from "@/assets";
import { ConfiguredVisualAsset } from "@/components/assets/configured-visual-asset";

interface GameArtworkSlotProps {
  incorrectGuesses: number;
  maximumIncorrectGuesses: number;
  status: GameStatus;
  themeId?: string;
}

export function GameArtworkSlot({
  incorrectGuesses,
  maximumIncorrectGuesses,
  status,
  themeId,
}: GameArtworkSlotProps) {
  const theme = getGameTheme(themeId);
  const resolvedArtwork = resolveGameArtwork(
    theme,
    status,
    incorrectGuesses,
    maximumIncorrectGuesses,
  );
  const accessibleArtwork = {
    ...resolvedArtwork.asset,
    alt:
      status === "won"
        ? "Completed hangman figure avoided; round won"
        : status === "lost"
          ? "Completed hangman figure; round lost"
          : incorrectGuesses === 0
            ? "Hangman figure clear; no mistakes made"
            : `Hangman figure after ${incorrectGuesses} of ${maximumIncorrectGuesses} allowed mistakes`,
  };

  return (
    <section
      aria-label="Main game visual"
      className="game-artwork-slot"
      data-artwork-state={resolvedArtwork.key}
      data-artwork-slot="primary-game-visual"
      data-game-theme={theme.id}
    >
      <div className="game-artwork-heading flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
          {GAME_COPY.artwork.label}
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--danger)]">
          <span className="size-1.5 rounded-full bg-current" /> {GAME_COPY.artwork.live}
        </span>
      </div>
      <div className="game-artwork-visual-wrap mt-2 flex flex-1 items-center justify-center">
        <ConfiguredVisualAsset
          asset={accessibleArtwork}
          className="game-artwork-visual h-44 w-full sm:h-52"
          priority
          sizes="(min-width: 1024px) 272px, 100vw"
        />
      </div>
      <div aria-hidden="true" className="game-artwork-progress mt-2 flex justify-center gap-1.5">
        {Array.from({ length: 7 }, (_, index) => {
          const activeStages = resolvedArtwork.key.startsWith("wrongGuess")
            ? Number(resolvedArtwork.key.slice(-2))
            : resolvedArtwork.key === "lose"
              ? 7
              : 0;

          return (
            <span
              className={`h-1.5 rounded-full transition-[width,background-color] ${
                index < activeStages
                  ? "w-4 bg-[var(--danger)]"
                  : "w-1.5 bg-[var(--border)]"
              }`}
              key={index}
            />
          );
        })}
      </div>
    </section>
  );
}
