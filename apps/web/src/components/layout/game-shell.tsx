import type { ReactNode } from "react";

import { AudioControl } from "@/components/navigation/audio-control";

export function GameShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="game-shell relative min-h-screen overflow-x-clip">
      <a className="skip-link" href="#main-content">
        Skip to game content
      </a>
      <div aria-hidden="true" className="game-grid pointer-events-none fixed inset-0 opacity-40" />
      <div aria-hidden="true" className="game-glow game-glow-top pointer-events-none fixed" />
      <div aria-hidden="true" className="game-glow game-glow-bottom pointer-events-none fixed" />
      <AudioControl />
      <main
        className="game-shell-main relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col"
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}
