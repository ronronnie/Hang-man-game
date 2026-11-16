import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { href: "/play", label: "Play" },
  { href: "/daily", label: "Daily" },
  { href: "/achievements", label: "Achievements" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <Link className="text-lg font-semibold tracking-tight" href="/">
          Hangman
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          {navigation.map((item) => (
            <Link className="transition-colors hover:text-white" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex flex-1 flex-col py-10">{children}</main>
    </div>
  );
}
