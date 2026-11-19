"use client";

import type { PlatformAdapters } from "@hangman/shared";
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createWebPlatformAdapters } from "./create-web-platform-adapters";

export const PlatformContext = createContext<PlatformAdapters | null>(null);
export interface AudioPreferences {
  muted: boolean;
  ready: boolean;
  setMuted: (muted: boolean) => Promise<void>;
}

export const AudioPreferencesContext = createContext<AudioPreferences | null>(null);

const AUDIO_MUTED_STORAGE_KEY = "audio-muted";

export function PlatformProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [adapters] = useState(createWebPlatformAdapters);
  const [muted, setMutedState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void adapters.storage
      .get<boolean>(AUDIO_MUTED_STORAGE_KEY)
      .catch(() => null)
      .then(async (savedPreference) => {
        const nextMuted = savedPreference ?? false;
        await adapters.audio.setMuted(nextMuted);
        if (!active) return;
        setMutedState(nextMuted);
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [adapters]);

  const setMuted = useCallback(
    async (nextMuted: boolean) => {
      await adapters.audio.setMuted(nextMuted);
      setMutedState(nextMuted);
      try {
        await adapters.storage.set(AUDIO_MUTED_STORAGE_KEY, nextMuted);
      } catch {
        // Audio remains usable even when browser storage is unavailable.
      }
    },
    [adapters],
  );

  const audioPreferences = useMemo(
    () => ({ muted, ready, setMuted }),
    [muted, ready, setMuted],
  );

  return (
    <PlatformContext.Provider value={adapters}>
      <AudioPreferencesContext.Provider value={audioPreferences}>
        {children}
      </AudioPreferencesContext.Provider>
    </PlatformContext.Provider>
  );
}
