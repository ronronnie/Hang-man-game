"use client";

import { GAME_COPY, GAME_MODES, type GameModeId } from "@hangman/game-core";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { usePlatformAdapters } from "@/hooks/use-platform-adapters";

type ModeTone = "classic" | "ultra" | "ultra-max";

interface ModePresentation {
  difficulty: string;
  eyebrow: string;
  supportingCopy: string;
  tone: ModeTone;
}

const MODE_PRESENTATION: Record<GameModeId, ModePresentation> = {
  "i-know-this-game": {
    difficulty: GAME_COPY.modeCards["i-know-this-game"].difficulty,
    eyebrow: GAME_COPY.modeCards["i-know-this-game"].eyebrow,
    supportingCopy: GAME_COPY.modeCards["i-know-this-game"].supporting,
    tone: "classic",
  },
  ultra: {
    difficulty: GAME_COPY.modeCards.ultra.difficulty,
    eyebrow: GAME_COPY.modeCards.ultra.eyebrow,
    supportingCopy: GAME_COPY.modeCards.ultra.supporting,
    tone: "ultra",
  },
  "ultra-max": {
    difficulty: GAME_COPY.modeCards["ultra-max"].difficulty,
    eyebrow: GAME_COPY.modeCards["ultra-max"].eyebrow,
    supportingCopy: GAME_COPY.modeCards["ultra-max"].supporting,
    tone: "ultra-max",
  },
};

const CARD_VARIANTS: Record<ModeTone, Variants> = {
  classic: {
    idle: { rotate: 0, scale: 1, y: 0 },
    hover: { scale: 1.008, y: -4 },
    tap: { scale: 0.992, y: -1 },
    selected: { scale: 1.012, y: -4 },
  },
  ultra: {
    idle: { rotate: 0, scale: 1, y: 0 },
    hover: { rotate: -0.2, scale: 1.018, y: -7 },
    tap: { scale: 0.99, y: -2 },
    selected: { rotate: -0.2, scale: 1.022, y: -7 },
  },
  "ultra-max": {
    idle: { rotate: 0, scale: 1, y: 0 },
    hover: { rotate: -0.45, scale: 1.03, y: -10 },
    tap: { rotate: 0.25, scale: 0.985, y: -3 },
    selected: { rotate: -0.45, scale: 1.035, y: -10 },
  },
};

export function ModeList() {
  const router = useRouter();
  const adapters = usePlatformAdapters();
  const prefersReducedMotion = useReducedMotion();
  const navigationTimeout = useRef<number | null>(null);
  const selectionLocked = useRef(false);
  const [selectedModeId, setSelectedModeId] = useState<GameModeId | null>(null);

  useEffect(() => {
    GAME_MODES.forEach((mode) => router.prefetch(`/play/${mode.id}`));

    return () => {
      if (navigationTimeout.current !== null) window.clearTimeout(navigationTimeout.current);
    };
  }, [router]);

  function selectMode(modeId: GameModeId) {
    if (selectionLocked.current || selectedModeId !== null) return;

    selectionLocked.current = true;
    setSelectedModeId(modeId);
    void Promise.allSettled([
      adapters.audio.play("button-click"),
      adapters.haptics.impact(modeId === "ultra-max" ? "medium" : "light"),
    ]);

    navigationTimeout.current = window.setTimeout(
      () => router.push(`/play/${modeId}`, { scroll: false }),
      prefersReducedMotion ? 0 : 320,
    );
  }

  return (
    <ul className="mode-list grid gap-4 md:grid-cols-3 md:items-stretch">
      {GAME_MODES.map((mode, index) => {
        const presentation = MODE_PRESENTATION[mode.id];
        const selected = selectedModeId === mode.id;
        const dimmed = selectedModeId !== null && !selected;

        return (
          <motion.li
            animate={{
              opacity: dimmed ? 0.42 : 1,
              scale: prefersReducedMotion ? 1 : dimmed ? 0.985 : 1,
            }}
            className="min-w-0"
            key={mode.id}
            transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
          >
            <motion.button
              animate={prefersReducedMotion ? "idle" : selected ? "selected" : "idle"}
              aria-label={`Select ${mode.label}, ${presentation.difficulty} difficulty`}
              className={`mode-card mode-card-${presentation.tone} group relative flex w-full flex-col overflow-hidden rounded-2xl text-left`}
              data-selected={selected}
              disabled={selectedModeId !== null}
              onClick={() => selectMode(mode.id)}
              onMouseEnter={() => void adapters.audio.play("button-hover")}
              transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.72 }}
              type="button"
              variants={CARD_VARIANTS[presentation.tone]}
              whileHover={selectedModeId === null && !prefersReducedMotion ? "hover" : undefined}
              whileTap={selectedModeId === null && !prefersReducedMotion ? "tap" : undefined}
            >
              <ModeCardAtmosphere
                active={!prefersReducedMotion}
                selected={selected}
                tone={presentation.tone}
              />

              <div className="mode-card-top relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className={`mode-card-eyebrow mode-card-eyebrow-${presentation.tone}`}>
                    {presentation.eyebrow}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                    Mode {String(index + 1).padStart(2, "0")}
                  </p>
                </div>
                <ModeSignal
                  animated={!prefersReducedMotion}
                  selected={selected}
                  tone={presentation.tone}
                />
              </div>

              <div className="mode-card-body relative z-10 mt-auto">
                <h2 className={`mode-card-title mode-card-title-${presentation.tone}`}>
                  {mode.label}
                </h2>
                <p className={`mode-card-copy mode-card-copy-${presentation.tone}`}>
                  {presentation.supportingCopy}
                </p>
              </div>

              <div className="mode-card-footer relative z-10 flex items-end justify-between gap-5 border-t border-current/15">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Difficulty
                  </p>
                  <p className={`mt-1 text-lg font-black uppercase mode-difficulty-${presentation.tone}`}>
                    {presentation.difficulty}
                  </p>
                </div>
                <motion.span
                  animate={selected && !prefersReducedMotion ? { x: [0, 4, 0] } : undefined}
                  aria-hidden="true"
                  className="text-2xl font-light"
                  transition={{ duration: 0.3 }}
                >
                  →
                </motion.span>
              </div>
            </motion.button>
          </motion.li>
        );
      })}
    </ul>
  );
}

function ModeSignal({
  animated,
  selected,
  tone,
}: {
  animated: boolean;
  selected: boolean;
  tone: ModeTone;
}) {
  return (
    <span aria-hidden="true" className={`mode-signal mode-signal-${tone}`}>
      <motion.span
        animate={selected && animated ? { opacity: [0.55, 1, 0.55], scale: [1, 1.18, 1] } : undefined}
        className="block size-full rounded-full bg-current"
        transition={{ duration: 0.7, repeat: selected && animated ? Number.POSITIVE_INFINITY : 0 }}
      />
    </span>
  );
}

function ModeCardAtmosphere({
  active,
  selected,
  tone,
}: {
  active: boolean;
  selected: boolean;
  tone: ModeTone;
}) {
  if (tone === "classic") {
    return (
      <div aria-hidden="true" className="absolute inset-0">
        <span className="absolute right-7 top-22 size-20 rounded-full border border-white/6" />
        <span className="absolute right-12 top-27 size-10 rounded-full border border-white/8" />
      </div>
    );
  }

  if (tone === "ultra") {
    return (
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((bar) => (
          <motion.span
            animate={selected ? { y: [0, -6, 0] } : undefined}
            className="absolute -top-8 h-44 w-px -rotate-12 bg-[var(--accent)]/20"
            key={bar}
            style={{ right: 42 + bar * 18 }}
            transition={{ delay: bar * 0.04, duration: 0.45 }}
          />
        ))}
        <span className="absolute bottom-0 left-0 h-1 w-2/3 bg-[var(--accent)]/65" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <motion.span
        animate={
          selected && active
            ? { opacity: [0.04, 0.1, 0.04], x: [0, -3, 2, 0] }
            : { opacity: 0.04, x: 0 }
        }
        className="absolute -right-4 top-20 font-mono text-[7.5rem] font-black leading-none tracking-[-0.1em] text-[var(--danger)]"
        transition={{ duration: 0.38, repeat: selected ? 1 : 0 }}
      >
        MAX
      </motion.span>
      <span className="absolute -right-9 top-8 h-px w-44 rotate-[-18deg] bg-[var(--danger)]/45" />
      <span className="absolute -right-6 top-14 h-px w-36 rotate-[-18deg] bg-[var(--danger)]/25" />
      <motion.span
        animate={selected && active ? { opacity: [0.35, 0.85, 0.35] } : { opacity: 0.35 }}
        className="absolute bottom-0 left-0 h-1 w-full bg-[var(--danger)]"
        transition={{ duration: 0.46, repeat: selected ? 1 : 0, ease: "easeInOut" }}
      />
    </div>
  );
}
