import { GAME_COPY, GAME_MODES_BY_ID, REGION_PREFERENCES_BY_ID, type GameModeId, type RegionPreference } from "@hangman/game-core";

import { CategoryList } from "@/components/game/category-list";
import { FlowHeader } from "@/components/navigation/flow-header";
import { TransitionItem } from "@/components/transitions/screen-transition";

interface CategorySelectionScreenProps {
  modeId: GameModeId;
  regionPreference: RegionPreference;
}

export function CategorySelectionScreen({ modeId, regionPreference }: CategorySelectionScreenProps) {
  return (
    <div className="flex flex-1 flex-col">
      <TransitionItem>
        <FlowHeader backHref={`/play/${modeId}`} step="03 / 03" />
      </TransitionItem>
      <div className="flex flex-1 flex-col justify-center py-8 sm:py-10">
        <TransitionItem>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
                {GAME_COPY.categorySelection.eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.045em] sm:text-6xl">
                {GAME_COPY.categorySelection.heading}
              </h1>
              <p className="mt-3 text-sm text-[var(--muted)] sm:text-base">
                {GAME_COPY.categorySelection.supporting}
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              {GAME_MODES_BY_ID[modeId].label} · {REGION_PREFERENCES_BY_ID[regionPreference].label}
            </span>
          </div>
        </TransitionItem>
        <TransitionItem className="mt-7">
          <CategoryList modeId={modeId} regionPreference={regionPreference} />
        </TransitionItem>
      </div>
    </div>
  );
}
