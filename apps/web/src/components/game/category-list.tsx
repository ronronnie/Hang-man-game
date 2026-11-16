import { CATEGORIES } from "@hangman/game-core";

export function CategoryList() {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((category) => (
        <li
          className="rounded-lg border border-[var(--border)] px-4 py-3"
          data-category-icon={category.icon}
          data-enabled={category.enabled}
          key={category.id}
        >
          <p className="text-sm font-medium">{category.name}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{category.description}</p>
        </li>
      ))}
    </ul>
  );
}
