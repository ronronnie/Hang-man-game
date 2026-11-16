import { CategoryList } from "@/components/game/category-list";
import { ModeList } from "@/components/game/mode-list";

export function GameSetupScreen() {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-[var(--accent)]">New game</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose how you want to play</h1>
      </header>
      <section aria-labelledby="modes-heading" className="space-y-4">
        <h2 className="text-lg font-medium" id="modes-heading">Modes</h2>
        <ModeList />
      </section>
      <section aria-labelledby="categories-heading" className="space-y-4">
        <h2 className="text-lg font-medium" id="categories-heading">Categories</h2>
        <CategoryList />
      </section>
      <p className="text-sm text-[var(--muted)]">
        Category selection will provide a word pool to the platform-independent game engine.
      </p>
    </div>
  );
}
