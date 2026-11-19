import Link from "next/link";

import type { VisualAssetSlot } from "@/assets";

import { GameLogo } from "./game-logo";

interface FlowHeaderProps {
  backHref?: string;
  logoAsset?: VisualAssetSlot;
  step?: string;
}

export function FlowHeader({ backHref, logoAsset, step }: FlowHeaderProps) {
  return (
    <header className="game-flow-header flex items-center justify-between gap-4">
      <GameLogo asset={logoAsset} />
      <div className="flex items-center gap-4">
        {step ? (
          <span className="font-mono text-[11px] tracking-[0.18em] text-[var(--muted)]">{step}</span>
        ) : null}
        {backHref ? (
          <Link
            aria-label="Go back"
            className="grid size-11 place-items-center rounded-full border border-[var(--border)] text-lg text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-white"
            href={backHref}
          >
            ←
          </Link>
        ) : null}
      </div>
    </header>
  );
}
