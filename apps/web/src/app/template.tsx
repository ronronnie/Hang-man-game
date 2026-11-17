"use client";

import type { ReactNode } from "react";

import { ScreenTransition } from "@/components/transitions/screen-transition";

export default function RootTemplate({ children }: Readonly<{ children: ReactNode }>) {
  return <ScreenTransition className="flex flex-1 flex-col">{children}</ScreenTransition>;
}
