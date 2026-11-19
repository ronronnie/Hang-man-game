"use client";

import { GAME_COPY } from "@hangman/game-core";
import { motion, useReducedMotion } from "framer-motion";

import { useAudioPreferences } from "@/hooks/use-audio-preferences";
import { usePlatformAdapters } from "@/hooks/use-platform-adapters";

export function AudioControl() {
  const adapters = usePlatformAdapters();
  const { muted, ready, setMuted } = useAudioPreferences();
  const prefersReducedMotion = useReducedMotion();

  function toggleAudio() {
    if (!ready) return;

    const nextMuted = !muted;
    void setMuted(nextMuted);
    if (!nextMuted) void adapters.audio.play("button-click");
  }

  return (
    <motion.button
      animate={{ opacity: ready ? 1 : 0.45 }}
      aria-label={
        ready
          ? muted
            ? GAME_COPY.audio.unmuteLabel
            : GAME_COPY.audio.muteLabel
          : GAME_COPY.audio.loadingLabel
      }
      aria-pressed={muted}
      className="global-audio-control"
      data-muted={muted ? "true" : "false"}
      disabled={!ready}
      onClick={toggleAudio}
      onMouseEnter={() => {
        if (ready && !muted) void adapters.audio.play("button-hover");
      }}
      type="button"
      whileHover={ready && !prefersReducedMotion ? { y: -2, scale: 1.025 } : undefined}
      whileTap={ready && !prefersReducedMotion ? { scale: 0.94, y: 0 } : undefined}
    >
      <span aria-hidden="true" className="global-audio-icon">
        <AudioIcon muted={muted} />
      </span>
      <span className="global-audio-label">
        {muted ? GAME_COPY.audio.off : GAME_COPY.audio.on}
      </span>
    </motion.button>
  );
}

function AudioIcon({ muted }: { muted: boolean }) {
  return (
    <svg fill="none" viewBox="0 0 20 20">
      <path d="M3 8v4h3l4 3V5L6 8H3Z" fill="currentColor" />
      {muted ? (
        <path d="m13 8 4 4m0-4-4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      ) : (
        <path d="M13 7.25a4 4 0 0 1 0 5.5M15 5.5a6.4 6.4 0 0 1 0 9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      )}
    </svg>
  );
}
