import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GameShell } from "@/components/layout/game-shell";
import { PlatformProvider } from "@/platform/platform-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hangman",
    template: "%s · Hangman",
  },
  description: "Classic Hangman pushed to the limit with timers, modifiers, and brutal modes.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PlatformProvider>
          <GameShell>{children}</GameShell>
        </PlatformProvider>
      </body>
    </html>
  );
}
