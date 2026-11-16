import type { AnalyticsAdapter } from "./analytics-adapter";
import type { AudioAdapter } from "./audio-adapter";
import type { HapticsAdapter } from "./haptics-adapter";
import type { ShareAdapter } from "./share-adapter";
import type { StorageAdapter } from "./storage-adapter";

export interface PlatformAdapters {
  analytics: AnalyticsAdapter;
  audio: AudioAdapter;
  haptics: HapticsAdapter;
  share: ShareAdapter;
  storage: StorageAdapter;
}
