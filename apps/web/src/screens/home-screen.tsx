import { dailyChallengeEnabled, GAME_COPY } from "@hangman/game-core";
import Link from "next/link";

import { GameLogo } from "@/components/navigation/game-logo";
import { TransitionItem } from "@/components/transitions/screen-transition";

const comingSoon = [GAME_COPY.home.comingSoon.howToPlay] as const;

export function HomeScreen() {
  return (
    <div className="flex flex-1 flex-col">
      <TransitionItem>
        <GameLogo />
      </TransitionItem>

      <div className="flex flex-1 flex-col justify-center py-14 sm:py-20">
        <TransitionItem>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.28em] text-[var(--accent)]">
            {GAME_COPY.home.eyebrow}
          </p>
        </TransitionItem>
        <TransitionItem>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.91] tracking-[-0.055em] sm:text-7xl lg:text-8xl">
            {GAME_COPY.home.titleLead}
            <br />
            <span className="text-[var(--accent)]">{GAME_COPY.home.titleAccent}</span>
          </h1>
        </TransitionItem>
        <TransitionItem>
          <p className="mt-7 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            {GAME_COPY.home.description}
          </p>
        </TransitionItem>

        <TransitionItem className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Link
            className="group inline-flex min-w-44 items-center justify-between gap-8 rounded-full bg-[var(--accent)] px-7 py-4 text-sm font-black tracking-[0.16em] text-black transition-transform hover:scale-[1.03] active:scale-[0.98]"
            href="/play"
          >
            {GAME_COPY.home.play}
            <span aria-hidden="true" className="text-lg transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            {GAME_COPY.home.challengeCount}
          </p>
        </TransitionItem>
      </div>

      <TransitionItem>
        <div className="grid gap-2 border-t border-[var(--border)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            className="game-card-interactive flex items-center justify-between rounded-xl border border-transparent px-3 py-3 text-left text-sm"
            href="/stats"
          >
            {GAME_COPY.home.comingSoon.stats}
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]">
              {GAME_COPY.home.comingSoon.open}
            </span>
          </Link>
          <Link
            className="game-card-interactive flex items-center justify-between rounded-xl border border-transparent px-3 py-3 text-left text-sm"
            href="/achievements"
          >
            {GAME_COPY.home.comingSoon.achievements}
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]">
              {GAME_COPY.home.comingSoon.open}
            </span>
          </Link>
          {dailyChallengeEnabled ? (
            <Link
              className="game-card-interactive flex items-center justify-between rounded-xl border border-transparent px-3 py-3 text-left text-sm"
              href="/daily"
            >
              {GAME_COPY.home.comingSoon.daily}
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]">
                {GAME_COPY.home.comingSoon.open}
              </span>
            </Link>
          ) : (
            <button
              className="flex cursor-not-allowed items-center justify-between rounded-xl border border-transparent px-3 py-3 text-left text-sm text-[var(--muted)] opacity-60"
              disabled
              type="button"
            >
              {GAME_COPY.home.comingSoon.daily}
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
                {GAME_COPY.home.comingSoon.status}
              </span>
            </button>
          )}
          {comingSoon.map((label) => (
            <button
              className="flex cursor-not-allowed items-center justify-between rounded-xl border border-transparent px-3 py-3 text-left text-sm text-[var(--muted)] opacity-60"
              disabled
              key={label}
              type="button"
            >
              {label}
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
                {GAME_COPY.home.comingSoon.status}
              </span>
            </button>
          ))}
        </div>
      </TransitionItem>
    </div>
  );
}
