"use client";

import { GAME_COPY, type AchievementUnlock } from "@hangman/game-core";
import { motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";

interface AchievementUnlockOverlayProps {
  unlocks: readonly AchievementUnlock[];
}

export function AchievementUnlockOverlay({ unlocks }: AchievementUnlockOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const canUseDom = useSyncExternalStore(subscribeToDom, () => true, () => false);

  if (!canUseDom) return null;

  return createPortal(
    <motion.div
      animate={{ opacity: 1 }}
      aria-live="assertive"
      className="achievement-unlock-overlay"
      exit={{ opacity: 0 }}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      role="status"
    >
      <div className="achievement-unlock-stack">
        {unlocks.map((unlock, index) => (
          <motion.article
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="achievement-unlock-card"
            initial={
              prefersReducedMotion ? false : { opacity: 0, scale: 0.96, x: 18 }
            }
            key={unlock.definition.id}
            transition={{
              delay: prefersReducedMotion ? 0 : index * 0.12,
              duration: prefersReducedMotion ? 0 : 0.34,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span aria-hidden="true" className="achievement-unlock-mark">
              ◆
            </span>
            <div>
              <p>{GAME_COPY.achievements.unlocked}</p>
              <h2>{unlock.definition.title}</h2>
              <span>{unlock.definition.description}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.div>,
    document.body,
  );
}

function subscribeToDom(): () => void {
  return () => undefined;
}
