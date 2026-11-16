"use client";

import type { PlatformAdapters } from "@hangman/shared";
import { createContext, type ReactNode, useState } from "react";

import { createWebPlatformAdapters } from "./create-web-platform-adapters";

export const PlatformContext = createContext<PlatformAdapters | null>(null);

export function PlatformProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [adapters] = useState(createWebPlatformAdapters);

  return <PlatformContext.Provider value={adapters}>{children}</PlatformContext.Provider>;
}
