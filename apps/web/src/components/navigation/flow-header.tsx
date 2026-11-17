import Link from "next/link";

import { GameLogo } from "./game-logo";

interface FlowHeaderProps {
  backHref?: string;
  step?: string;
}

export function FlowHeader({ backHref, step }: FlowHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <GameLogo />
      <div className="flex items-center gap-4">
        {step ? (
          <span className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)]">{step}</span>
        ) : null}
        {backHref ? (
          <Link
            aria-label="Go back"
            className="grid size-9 place-items-center rounded-full border border-[var(--border)] text-lg text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-white"
            href={backHref}
          >
            ←
          </Link>
        ) : null}
      </div>
    </header>
  );
}
