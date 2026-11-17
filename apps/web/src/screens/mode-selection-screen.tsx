import { ModeList } from "@/components/game/mode-list";
import { FlowHeader } from "@/components/navigation/flow-header";
import { TransitionItem } from "@/components/transitions/screen-transition";

export function ModeSelectionScreen() {
  return (
    <div className="flex flex-1 flex-col">
      <TransitionItem>
        <FlowHeader backHref="/" step="01 / 02" />
      </TransitionItem>
      <div className="flex flex-1 flex-col justify-center py-12 sm:py-16">
        <TransitionItem>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
            Select mode
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-6xl">
            How hard do you want it?
          </h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            Start familiar, add pressure, or let Ultra Max rewrite the rules.
          </p>
        </TransitionItem>
        <TransitionItem className="mt-9">
          <ModeList />
        </TransitionItem>
      </div>
    </div>
  );
}
