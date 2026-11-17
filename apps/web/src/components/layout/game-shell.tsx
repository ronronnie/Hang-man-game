import type { ReactNode } from "react";

export function GameShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="game-shell relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="game-grid pointer-events-none fixed inset-0 opacity-40" />
      <div aria-hidden="true" className="game-glow game-glow-top pointer-events-none fixed" />
      <div aria-hidden="true" className="game-glow game-glow-bottom pointer-events-none fixed" />
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        {children}
      </main>
    </div>
  );
}
