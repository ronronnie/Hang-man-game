import { CATEGORIES, type CategoryId, type GameModeId } from "@hangman/game-core";
import Link from "next/link";

const categoryGlyphs: Record<CategoryId, string> = {
  movies: "MOV",
  "tv-shows": "TV",
  music: "MUS",
  "video-games": "GAME",
  sports: "SPT",
  geography: "GEO",
  science: "SCI",
  books: "BOOK",
  "general-knowledge": "GK",
  "surprise-me": "?",
};

interface CategoryListProps {
  modeId: GameModeId;
}

export function CategoryList({ modeId }: CategoryListProps) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {CATEGORIES.filter((category) => category.enabled).map((category) => (
        <li key={category.id}>
          <Link
            className="game-card game-card-interactive group flex min-h-36 flex-col rounded-2xl p-4"
            data-category-icon={category.icon}
            href={`/play/${modeId}/${category.id}`}
          >
            <span className="font-mono text-[10px] font-black tracking-[0.14em] text-[var(--accent)]">
              {categoryGlyphs[category.id]}
            </span>
            <div className="mt-auto flex items-end justify-between gap-3 pt-6">
              <div>
                <h2 className="text-sm font-bold leading-tight">{category.name}</h2>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--muted)]">
                  {category.description}
                </p>
              </div>
              <span className="pb-0.5 text-[var(--muted)] transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
