"use client";

import {
  createEmptyPlayerStatistics,
  type PlayerStatistics,
} from "@hangman/game-core";
import { useEffect, useState } from "react";

import { usePlatformAdapters } from "@/hooks/use-platform-adapters";
import { loadPlayerStatistics } from "@/statistics/player-statistics-storage";

export function usePlayerStatistics(): {
  loaded: boolean;
  statistics: Readonly<PlayerStatistics>;
} {
  const adapters = usePlatformAdapters();
  const [statistics, setStatistics] = useState<Readonly<PlayerStatistics>>(
    createEmptyPlayerStatistics,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    void loadPlayerStatistics(adapters.storage).then((nextStatistics) => {
      if (!active) return;
      setStatistics(nextStatistics);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [adapters.storage]);

  return { loaded, statistics };
}
