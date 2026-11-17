import {
  CATEGORIES_BY_ID,
  GAME_MODES_BY_ID,
  type CategoryId,
  type GameModeId,
  type WordEntry,
} from "@hangman/game-core";
import Link from "next/link";

import { GameLogo } from "@/components/navigation/game-logo";
import { TransitionItem } from "@/components/transitions/screen-transition";

interface ResultsScreenProps {
  categoryId: CategoryId;
  modeId: GameModeId;
  outcome: "won" | "lost";
  remainingAttempts: number;
  word: WordEntry;
}

export function ResultsScreen({
  categoryId,
  modeId,
  outcome,
  remainingAttempts,
  word,
}: ResultsScreenProps) {
  const won = outcome === "won";

  return (
    <div className="flex flex-1 flex-col">
      <TransitionItem>
        <GameLogo />
      </TransitionItem>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-14">
        <TransitionItem>
          <div
            className={`inline-flex size-14 items-center justify-center rounded-full border text-2xl ${
              won
                ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"
            }`}
          >
            {won ? "✓" : "×"}
          </div>
          <p
            className={`mt-6 font-mono text-xs font-bold uppercase tracking-[0.24em] ${won ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}
          >
            {won ? "Round survived" : "Round over"}
          </p>
          <h1 className="mt-3 text-5xl font-black leading-none tracking-[-0.05em] sm:text-7xl">
            {won ? "You got it." : "Not this time."}
          </h1>
        </TransitionItem>

        <TransitionItem className="game-card mt-9 rounded-2xl p-5 sm:p-7">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">
            The answer
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
            {word.displayAnswer}
          </p>
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-5">
            <ResultStat label="Mode" value={GAME_MODES_BY_ID[modeId].label} />
            <ResultStat label="Category" value={CATEGORIES_BY_ID[word.genre].name} />
            <ResultStat label="Attempts left" value={String(remainingAttempts)} />
          </div>
        </TransitionItem>

        <TransitionItem className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-7 py-4 text-sm font-black tracking-[0.12em] text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            href={`/play/${modeId}/${categoryId}?exclude=${encodeURIComponent(word.id)}`}
          >
            PLAY AGAIN
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-7 py-4 text-sm font-bold transition-colors hover:border-white"
            href={`/play/${modeId}`}
          >
            Change category
          </Link>
          <Link
            className="inline-flex items-center justify-center px-5 py-4 text-sm text-[var(--muted)] transition-colors hover:text-white"
            href="/"
          >
            Home
          </Link>
        </TransitionItem>
      </div>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 truncate text-xs font-bold sm:text-sm">{value}</p>
    </div>
  );
}
