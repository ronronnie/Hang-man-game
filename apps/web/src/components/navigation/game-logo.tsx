import Link from "next/link";

export function GameLogo() {
  return (
    <Link className="inline-flex items-center gap-2 text-sm font-black tracking-[0.18em]" href="/">
      <span className="grid size-7 place-items-center rounded-md bg-[var(--accent)] text-xs text-black">
        H
      </span>
      HANGMAN
    </Link>
  );
}
