"use client";

import { GAME_COPY } from "@hangman/game-core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface UltraComboMeterProps {
  consecutiveCorrect: number;
  multiplier: number;
}

const COMBO_STEPS = [1, 2, 3, 4, 5] as const;

export function UltraComboMeter({
  consecutiveCorrect,
  multiplier,
}: UltraComboMeterProps) {
  const prefersReducedMotion = useReducedMotion();
  const active = consecutiveCorrect >= 2;

  return (
    <div
      aria-label={`${consecutiveCorrect} consecutive correct guesses, ${multiplier} times combo`}
      className="ultra-combo"
      data-active={active}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="game-meta-label">{GAME_COPY.combo.label}</span>
        <motion.span
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="ultra-combo-multiplier"
          initial={prefersReducedMotion ? false : { opacity: 0.5, scale: 1.3, y: -3 }}
          key={multiplier}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        >
          ×{formatMultiplier(multiplier)}
        </motion.span>
      </div>
      <div aria-hidden="true" className="ultra-combo-track">
        {COMBO_STEPS.map((step) => (
          <motion.span
            animate={
              step <= consecutiveCorrect
                ? { filter: "brightness(1.2)", opacity: 1 }
                : { filter: "brightness(1)", opacity: 0.62 }
            }
            className="ultra-combo-step"
            data-active={step <= consecutiveCorrect}
            data-threshold={step >= 2}
            key={step}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="ultra-combo-caption"
          exit={{ opacity: 0, y: -2 }}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 2 }}
          key={active ? consecutiveCorrect : "idle"}
          transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
        >
          {active
            ? `${consecutiveCorrect} ${GAME_COPY.combo.activeSuffix}`
            : GAME_COPY.combo.idle}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function formatMultiplier(multiplier: number): string {
  return Number.isInteger(multiplier) ? multiplier.toFixed(0) : multiplier.toFixed(1);
}
