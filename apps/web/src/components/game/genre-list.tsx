import { GENRES } from "@hangman/game-core";

export function GenreList() {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {GENRES.map((genre) => (
        <li className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm" key={genre.id}>
          {genre.label}
        </li>
      ))}
    </ul>
  );
}
