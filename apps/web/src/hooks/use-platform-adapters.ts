"use client";

import { useContext } from "react";

import { PlatformContext } from "@/platform/platform-provider";

export function usePlatformAdapters() {
  const adapters = useContext(PlatformContext);

  if (!adapters) {
    throw new Error("usePlatformAdapters must be used within PlatformProvider");
  }

  return adapters;
}
