"use client";

import { useContext } from "react";

import { AudioPreferencesContext } from "@/platform/platform-provider";

export function useAudioPreferences() {
  const preferences = useContext(AudioPreferencesContext);

  if (!preferences) {
    throw new Error("useAudioPreferences must be used within PlatformProvider");
  }

  return preferences;
}
