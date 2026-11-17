import { GAME_MODES_BY_ID, type GameModeId } from "@hangman/game-core";

import { CategoryList } from "@/components/game/category-list";
import { FlowHeader } from "@/components/navigation/flow-header";
import { TransitionItem } from "@/components/transitions/screen-transition";

interface CategorySelectionScreenProps {
  modeId: GameModeId;
}

export function CategorySelectionScreen({ modeId }: CategorySelectionScreenProps) {
  return (
    <div className="flex flex-1 flex-col">
      <TransitionItem>
        <FlowHeader backHref="/play" step="02 / 02" />
      </TransitionItem>
      <div className="flex flex-1 flex-col justify-center py-10 sm:py-14">
        <TransitionItem>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
                Select category
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-6xl">
                Pick your territory.
              </h1>
            </div>
            <span className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
              {GAME_MODES_BY_ID[modeId].label}
            </span>
          </div>
        </TransitionItem>
        <TransitionItem className="mt-8">
          <CategoryList modeId={modeId} />
        </TransitionItem>
      </div>
    </div>
  );
}
