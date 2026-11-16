import type { PlatformAdapters } from "@hangman/shared";

import {
  BrowserAudioAdapter,
  BrowserHapticsAdapter,
  BrowserShareAdapter,
  LocalStorageAdapter,
  NoopAnalyticsAdapter,
} from "./adapters";

export function createWebPlatformAdapters(): PlatformAdapters {
  return {
    analytics: new NoopAnalyticsAdapter(),
    audio: new BrowserAudioAdapter(),
    haptics: new BrowserHapticsAdapter(),
    share: new BrowserShareAdapter(),
    storage: new LocalStorageAdapter(),
  };
}
