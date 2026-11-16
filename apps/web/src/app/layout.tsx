import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PlatformProvider } from "@/platform/platform-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hangman",
    template: "%s · Hangman",
  },
  description: "A modern word-guessing game built for web and mobile.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PlatformProvider>
          <AppShell>{children}</AppShell>
        </PlatformProvider>
      </body>
    </html>
  );
}
