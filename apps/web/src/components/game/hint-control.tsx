"use client";

import {
  GAME_COPY,
  describeHintCost,
  type GameModeId,
  type HintDefinition,
  type HintKind,
} from "@hangman/game-core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

interface HintControlProps {
  modeId: GameModeId;
  options: readonly HintDefinition[];
  revealedContent: string | null;
  remainingAttempts: number;
  remainingTimeSeconds: number | null;
  onConfirm: (hintKind: HintKind) => void;
}

export function HintControl({
  modeId,
  onConfirm,
  options,
  remainingAttempts,
  remainingTimeSeconds,
  revealedContent,
}: HintControlProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKind, setSelectedKind] = useState<HintKind | null>(null);
  const selected = options.find((option) => option.kind === selectedKind) ?? null;
  const isUltraMax = modeId === "ultra-max";
  const selectedCostEndsRound = Boolean(
    selected &&
      ((selected.cost.type === "attempt" && selected.cost.attempts >= remainingAttempts) ||
        (selected.cost.type === "time" &&
          remainingTimeSeconds !== null &&
          selected.cost.seconds >= remainingTimeSeconds)),
  );

  function selectHint(option: HintDefinition) {
    if (!option.requiresConfirmation) {
      onConfirm(option.kind);
      setSelectedKind(null);
      setIsOpen(false);
      return;
    }
    setSelectedKind(option.kind);
  }

  function confirmHint() {
    if (!selected) return;
    onConfirm(selected.kind);
    setSelectedKind(null);
    setIsOpen(false);
  }

  return (
    <div className="hint-control" data-danger={isUltraMax ? "true" : "false"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="game-meta-label">{GAME_COPY.hints.heading}</p>
          <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--muted)]">
            {options.length > 0
              ? `${options.length} option${options.length === 1 ? "" : "s"}`
              : GAME_COPY.hints.depleted}
          </p>
        </div>
        {options.length > 0 ? (
          <motion.button
            aria-controls="hint-options"
            aria-expanded={isOpen}
            aria-haspopup="true"
            className="hint-menu-trigger"
            onClick={() => {
              setSelectedKind(null);
              setIsOpen((open) => !open);
            }}
            type="button"
            whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.025 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
          >
            {isOpen ? GAME_COPY.hints.close : GAME_COPY.hints.options}
          </motion.button>
        ) : null}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {isOpen ? (
          <motion.div
            animate={{ height: "auto", opacity: 1, y: 0 }}
            className="hint-options"
            exit={prefersReducedMotion ? { display: "none" } : { height: 0, opacity: 0, y: -4 }}
            id="hint-options"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0, y: -4 }}
            key="options"
            role="group"
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            {options.map((option) => (
              <motion.button
                aria-label={`${option.label}. ${option.description}. Cost: ${describeHintCost(option.cost)}`}
                aria-pressed={selectedKind === option.kind}
                className="hint-option"
                data-selected={selectedKind === option.kind ? "true" : "false"}
                key={option.id}
                onClick={() => selectHint(option)}
                type="button"
                whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
              >
                <span>
                  <b>{option.label}</b>
                  <small>{option.description}</small>
                </span>
                <em>{describeHintCost(option.cost)}</em>
              </motion.button>
            ))}

            <AnimatePresence initial={false}>
              {selected ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="hint-confirmation"
                  exit={{ opacity: 0, y: -3 }}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 3 }}
                  key={selected.id}
                  role="alert"
                  transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                >
                  <div>
                    <p>
                      {isUltraMax ? GAME_COPY.hints.confirmUltraMax : GAME_COPY.hints.confirm}
                    </p>
                    <strong>{describeHintCost(selected.cost)}</strong>
                    {selectedCostEndsRound ? (
                      <strong className="block text-[var(--danger)]">
                        {GAME_COPY.hints.terminalCost}
                      </strong>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setSelectedKind(null)}
                      type="button"
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                    >
                      {GAME_COPY.hints.cancel}
                    </motion.button>
                    <motion.button
                      className="hint-confirm-button"
                      onClick={confirmHint}
                      type="button"
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.025 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                    >
                      {selected.cost.type === "none"
                        ? GAME_COPY.hints.useFree
                        : GAME_COPY.hints.usePaid}
                    </motion.button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : revealedContent ? (
          <motion.p
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="hint-revealed-content"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97, y: 5 }}
            key={revealedContent}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            {revealedContent}
          </motion.p>
        ) : (
          <motion.p className="hint-idle-copy" key="idle">
            {options.length > 0 ? GAME_COPY.hints.idle : GAME_COPY.hints.empty}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
