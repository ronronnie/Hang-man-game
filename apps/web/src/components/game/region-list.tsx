"use client";

import {
  REGION_PREFERENCE_DEFINITIONS,
  type GameModeId,
  type RegionPreference,
} from "@hangman/game-core";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  loadRegionPreference,
  saveRegionPreference,
} from "@/gameplay/region-preference-storage";
import { usePlatformAdapters } from "@/hooks/use-platform-adapters";

export function RegionList({ modeId }: { modeId: GameModeId }) {
  const adapters = usePlatformAdapters();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const navigationTimer = useRef<number | null>(null);
  const [remembered, setRemembered] = useState<RegionPreference | null>(null);
  const [selected, setSelected] = useState<RegionPreference | null>(null);

  useEffect(() => {
    let active = true;
    void loadRegionPreference(adapters.storage).then((preference) => {
      if (active) setRemembered(preference);
    });
    return () => {
      active = false;
      if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current);
    };
  }, [adapters.storage]);

  function chooseRegion(preference: RegionPreference) {
    if (selected) return;
    setSelected(preference);
    void Promise.allSettled([
      saveRegionPreference(adapters.storage, preference),
      adapters.audio.play("button-click"),
      adapters.haptics.impact(preference === "mixed" ? "medium" : "light"),
    ]);
    navigationTimer.current = window.setTimeout(
      () => router.push(`/play/${modeId}/${preference}`, { scroll: false }),
      prefersReducedMotion ? 0 : 220,
    );
  }

  return (
    <ul className="region-grid">
      {REGION_PREFERENCE_DEFINITIONS.map((region, index) => {
        const isSelected = selected === region.id;
        const isRemembered = remembered === region.id;
        return (
          <motion.li
            animate={{ opacity: selected && !isSelected ? 0.42 : 1 }}
            key={region.id}
            transition={{ duration: 0.16 }}
          >
            <motion.button
              aria-label={`Use ${region.label} content`}
              className="region-card"
              data-region={region.id}
              data-selected={isSelected}
              disabled={selected !== null}
              onClick={() => chooseRegion(region.id)}
              onMouseEnter={() => {
                router.prefetch(`/play/${modeId}/${region.id}`);
                void adapters.audio.play("button-hover");
              }}
              type="button"
              whileHover={prefersReducedMotion || selected ? undefined : { y: -5, scale: 1.012 }}
              whileTap={prefersReducedMotion || selected ? undefined : { scale: 0.98 }}
            >
              <span className="region-card-index">0{index + 1}</span>
              <span className="region-card-code">{region.code}</span>
              <span className="region-card-title">{region.label}</span>
              <span className="region-card-copy">{region.supporting}</span>
              <span className="region-card-footer">
                {isRemembered ? "LAST PICK" : "CHOOSE"}
                <b aria-hidden="true">→</b>
              </span>
            </motion.button>
          </motion.li>
        );
      })}
    </ul>
  );
}
