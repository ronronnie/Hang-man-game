import type { AudioCue, PlatformAdapters } from "@hangman/shared";

import { UI_ASSETS } from "@/assets";

import {
  BrowserAudioAdapter,
  BrowserHapticsAdapter,
  BrowserShareAdapter,
  LocalStorageAdapter,
  NoopAnalyticsAdapter,
} from "./adapters";

const WEB_AUDIO_SOURCES = Object.entries(UI_ASSETS.soundEffects) as readonly (
  readonly [AudioCue, string]
)[];

export function createWebPlatformAdapters(): PlatformAdapters {
  const audio = new BrowserAudioAdapter();
  WEB_AUDIO_SOURCES.forEach(([cue, source]) => {
    void audio.register(cue, source);
  });

  return {
    analytics: new NoopAnalyticsAdapter(),
    audio,
    haptics: new BrowserHapticsAdapter(),
    share: new BrowserShareAdapter(),
    storage: new LocalStorageAdapter(),
  };
}
