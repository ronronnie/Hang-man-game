"use client";

import {
  CATEGORIES_BY_ID,
  GAME_COPY,
  MODIFIERS_BY_ID,
  type ActiveModifier,
} from "@hangman/game-core";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface UltraMaxModifierRevealProps {
  categoryId: keyof typeof CATEGORIES_BY_ID;
  modifier: ActiveModifier;
  onComplete: () => void;
}

const REVEAL_DURATION_MS = 4000;

export function UltraMaxModifierReveal({
  categoryId,
  modifier,
  onComplete,
}: UltraMaxModifierRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const definition = MODIFIERS_BY_ID[modifier.id];
  const canUseDom = useSyncExternalStore(subscribeToDom, () => true, () => false);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      onComplete,
      prefersReducedMotion ? 900 : REVEAL_DURATION_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [onComplete, prefersReducedMotion]);

  if (!canUseDom) return null;

  return createPortal(
    <motion.div
      animate={{ opacity: 1 }}
      aria-label={`Ultra Max ${definition.label} modifier. ${definition.description}`}
      className="ultra-max-reveal"
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.025 }}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      role="status"
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="ultra-max-reveal-content"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
        transition={{ delay: 0.12, duration: 0.42 }}
      >
        <p className="ultra-max-reveal-overline">{GAME_COPY.ultraMaxReveal.overline}</p>
        <p className="ultra-max-reveal-category">
          Category · {CATEGORIES_BY_ID[categoryId].name}
        </p>
        <h1>{definition.label} Mode</h1>
        <p className="ultra-max-reveal-copy">“{definition.description}”</p>
        <p className="ultra-max-reveal-taunt">{GAME_COPY.ultraMaxReveal.taunt}</p>
        <div aria-hidden="true" className="ultra-max-reveal-rule">
          <motion.span
            animate={{ scaleX: 1 }}
            initial={{ scaleX: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : REVEAL_DURATION_MS / 1000, ease: "linear" }}
          />
        </div>
        <p className="ultra-max-reveal-status">{GAME_COPY.ultraMaxReveal.status}</p>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function subscribeToDom(): () => void {
  return () => undefined;
}
