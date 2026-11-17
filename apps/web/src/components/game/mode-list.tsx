import { GAME_MODES } from "@hangman/game-core";
import Link from "next/link";

const modeDetails = {
  "i-know-this-game": { badge: "Classic", timer: "No timer", tone: "7 lives" },
  ultra: { badge: "Intense", timer: "60 seconds", tone: "2× score" },
  "ultra-max": { badge: "Unforgiving", timer: "45 seconds", tone: "4× score" },
} as const;

export function ModeList() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {GAME_MODES.map((mode) => (
        <Link
          className="game-card game-card-interactive group flex min-h-56 flex-col rounded-2xl p-5 sm:p-6"
          href={`/play/${mode.id}`}
          key={mode.id}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              {modeDetails[mode.id].badge}
            </span>
            <span className="text-xl text-[var(--muted)] transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
          <h2 className="mt-8 text-2xl font-black tracking-[-0.03em]">{mode.label}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{mode.description}</p>
          <div className="mt-auto flex gap-2 pt-7 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            <span className="rounded-full border border-[var(--border)] px-3 py-1.5">
              {modeDetails[mode.id].timer}
            </span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1.5">
              {modeDetails[mode.id].tone}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
