import { GAME_MODES } from "@hangman/game-core";

export function ModeList() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {GAME_MODES.map((mode) => (
        <div className="rounded-xl border border-[var(--border)] p-4" key={mode.id}>
          <h3 className="font-medium">{mode.label}</h3>
          <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{mode.description}</p>
        </div>
      ))}
    </div>
  );
}
