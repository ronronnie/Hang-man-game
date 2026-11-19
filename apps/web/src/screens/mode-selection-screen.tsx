import { GAME_COPY } from "@hangman/game-core";

import { ModeList } from "@/components/game/mode-list";
import { FlowHeader } from "@/components/navigation/flow-header";
import { TransitionItem } from "@/components/transitions/screen-transition";

export function ModeSelectionScreen() {
  return (
    <div className="flex flex-1 flex-col">
      <TransitionItem>
        <FlowHeader backHref="/" step="01 / 03" />
      </TransitionItem>
      <div className="flex flex-1 flex-col justify-center py-10 sm:py-12">
        <TransitionItem>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
            {GAME_COPY.modeSelection.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-6xl">
            {GAME_COPY.modeSelection.heading}
          </h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            {GAME_COPY.modeSelection.supporting}
          </p>
        </TransitionItem>
        <TransitionItem className="mt-9">
          <ModeList />
        </TransitionItem>
      </div>
    </div>
  );
}
