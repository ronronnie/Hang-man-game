"use client";

import {
  CATEGORIES_BY_ID,
  GAME_COPY,
  GAME_MODES_BY_ID,
  createGameEngine,
  createSeededRandom,
  describeHintCost,
  getCrossedUltraUrgencyThreshold,
  getForgottenIncorrectLetters,
  getSecondaryWord,
  getUltraComboMultiplier,
  getUltraUrgencyLevel,
  getVisibleAnswers,
  getVisibleIncorrectLetters,
  normalizeLetter,
  pickCopyLine,
  type AchievementUnlock,
  type CategoryId,
  type GameModeId,
  type GameState,
  type GuessResult,
  type HintKind,
  type RegionPreference,
  type RecordCompletedRoundResult,
  type UltraUrgencyLevel,
  type UltraUrgencyThreshold,
  type WordEntry,
} from "@hangman/game-core";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getGameTheme, getModeAssets, UI_ASSETS } from "@/assets";
import { AchievementUnlockOverlay } from "@/components/game/achievement-unlock-overlay";
import { AnimatedNumber } from "@/components/game/animated-number";
import { GameArtworkSlot } from "@/components/game/game-artwork-slot";
import { GuessKeyboard } from "@/components/game/guess-keyboard";
import { HintControl } from "@/components/game/hint-control";
import { ModeBackdrop } from "@/components/game/mode-backdrop";
import { PuzzleAnswer } from "@/components/game/puzzle-answer";
import { UltraComboMeter } from "@/components/game/ultra-combo-meter";
import { UltraMaxModifierReveal } from "@/components/game/ultra-max-modifier-reveal";
import { FlowHeader } from "@/components/navigation/flow-header";
import {
  clearActiveRound,
  loadActiveRound,
  saveActiveRound,
} from "@/gameplay/active-round-storage";
import { usePlatformAdapters } from "@/hooks/use-platform-adapters";
import { recordLocalCompletedRound } from "@/statistics/player-statistics-storage";

const BASE_ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

type FeedbackTone = "neutral" | "correct" | "incorrect";

interface GameScreenProps {
  modeId: GameModeId;
  regionPreference: RegionPreference;
  roundToken: string;
  selectedCategoryId: CategoryId;
  roundSeed: number;
  word: WordEntry;
  wordPool: readonly WordEntry[];
}

export function GameScreen({
  modeId,
  regionPreference,
  roundSeed,
  roundToken,
  selectedCategoryId,
  word,
  wordPool,
}: GameScreenProps) {
  const router = useRouter();
  const adapters = usePlatformAdapters();
  const prefersReducedMotion = useReducedMotion();
  const stageControls = useAnimationControls();
  const puzzleControls = useAnimationControls();
  const comboControls = useAnimationControls();
  const urgencyControls = useAnimationControls();
  const [engine] = useState(() =>
    createGameEngine({
      words: wordPool,
      mode: modeId,
      initialWordId: word.id,
      random: createSeededRandom(roundSeed),
    }),
  );
  const [state, setState] = useState<Readonly<GameState>>(() => engine.getState());
  const [isRestoringRound, setIsRestoringRound] = useState(true);
  const [feedback, setFeedback] = useState<string>(GAME_COPY.gameplay.initialFeedback);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("neutral");
  const [solveInput, setSolveInput] = useState("");
  const [hintContent, setHintContent] = useState<string | null>(null);
  const [achievementUnlocks, setAchievementUnlocks] = useState<readonly AchievementUnlock[]>([]);
  const completionResult = useRef<Promise<RecordCompletedRoundResult> | null>(null);
  const completionFeedbackPlayed = useRef(false);
  const stateRef = useRef(state);
  const lastPersistedFingerprint = useRef("");
  const guessHandlerRef = useRef<(letter: string) => void>(() => undefined);
  const stableHandleGuess = useCallback((letter: string) => {
    guessHandlerRef.current(letter);
  }, []);
  const roundIdentity = useMemo(
    () => ({ modeId, regionPreference, roundToken, selectedCategoryId }),
    [modeId, regionPreference, roundToken, selectedCategoryId],
  );
  const mode = GAME_MODES_BY_ID[modeId];
  const gameTheme = useMemo(() => getGameTheme(), []);
  const modeAssets = useMemo(() => getModeAssets(modeId), [modeId]);
  const modeStyle = {
    "--accent": modeAssets.uiTreatment?.accent,
    "--danger": modeAssets.uiTreatment?.danger,
    "--mode-surface-tint": modeAssets.uiTreatment?.surfaceTint,
  } as CSSProperties;
  const hasTimer = state.timer !== null;
  const incorrectGuessCount = state.maximumAttempts - state.remainingAttempts;
  const hintOptions = engine.getAvailableHints();
  const previousTimerSeconds = useRef(state.timer?.remainingSeconds ?? Number.POSITIVE_INFINITY);
  const previousCountdownSecond = useRef(
    state.timer ? Math.ceil(state.timer.remainingSeconds) : Number.POSITIVE_INFINITY,
  );
  const isUltra = modeId === "ultra";
  const isUltraMax = modeId === "ultra-max";
  const activeModifier = state.modifiers[0] ?? null;
  const secondaryWord = getSecondaryWord(state);
  const visibleAnswers = getVisibleAnswers(state);
  const visibleIncorrectLetters = getVisibleIncorrectLetters(state);
  const forgottenIncorrectLetters = getForgottenIncorrectLetters(state);
  const comboMultiplier = isUltra ? getUltraComboMultiplier(state.streak.current) : 1;
  const urgencyLevel = state.timer
    ? getUltraUrgencyLevel(state.timer.remainingSeconds)
    : "steady";
  const roundAlphabet = useMemo(
    () => buildAlphabet(`${state.word.displayAnswer} ${secondaryWord?.displayAnswer ?? ""}`),
    [secondaryWord?.displayAnswer, state.word.displayAnswer],
  );
  const beginUltraMaxRound = useCallback(() => {
    setState(engine.beginRound());
  }, [engine]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let active = true;

    void loadActiveRound(adapters.storage, roundIdentity)
      .then((snapshot) => {
        if (!active || !snapshot) return;

        let restored = engine.restoreRound(snapshot.state);
        if (restored.status === "playing" && restored.timer) {
          const elapsedWhileAway = Math.max(0, (Date.now() - snapshot.savedAtEpochMs) / 1000);
          if (elapsedWhileAway > 0) {
            restored = engine.advanceTime(elapsedWhileAway).state;
          }
        }
        if (!active) return;
        setState(restored);
        setFeedback(
          restored.status === "playing"
            ? GAME_COPY.gameplay.resumedFeedback
            : GAME_COPY.gameplay.initialFeedback,
        );
      })
      .catch(() => clearActiveRound(adapters.storage, roundToken).catch(() => undefined))
      .finally(() => {
        if (active) setIsRestoringRound(false);
      });

    return () => {
      active = false;
    };
  }, [adapters.storage, engine, roundIdentity, roundToken]);

  useEffect(() => {
    if (isRestoringRound) return;
    if (!["ready", "playing", "won", "lost"].includes(state.status)) {
      lastPersistedFingerprint.current = "";
      void clearActiveRound(adapters.storage, roundToken).catch(() => undefined);
      return;
    }

    const fingerprint = [
      state.roundId,
      state.status,
      state.turn,
      state.hints.usages.length,
      state.remainingAttempts,
      Math.floor(state.timer?.elapsedRealSeconds ?? 0),
    ].join(":");
    if (lastPersistedFingerprint.current === fingerprint) return;

    lastPersistedFingerprint.current = fingerprint;
    void saveActiveRound(adapters.storage, roundIdentity, state).catch(() => undefined);
  }, [adapters.storage, isRestoringRound, roundIdentity, roundToken, state]);

  useEffect(() => {
    if (isRestoringRound) return;

    function persistLatestState() {
      const latestState = stateRef.current;
      if (["ready", "playing", "won", "lost"].includes(latestState.status)) {
        void saveActiveRound(adapters.storage, roundIdentity, latestState).catch(() => undefined);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") persistLatestState();
    }

    window.addEventListener("pagehide", persistLatestState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", persistLatestState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [adapters.storage, isRestoringRound, roundIdentity]);

  useEffect(() => {
    const audioSources = {
      ...UI_ASSETS.soundEffects,
      ...modeAssets.soundEffects,
    };

    Object.entries(audioSources).forEach(([cue, source]) => {
      void adapters.audio.register(cue as keyof typeof audioSources, source);
    });
  }, [adapters.audio, modeAssets.soundEffects]);

  useEffect(() => {
    if (isRestoringRound || !isUltraMax || state.status !== "ready" || !activeModifier) return;
    void Promise.allSettled([
      adapters.audio.play("ultra-max-reveal"),
      adapters.haptics.impact("medium"),
      adapters.analytics.track("modifier_revealed", {
        modifierId: activeModifier.id,
        mode: modeId,
      }),
    ]);
  }, [activeModifier, adapters, isRestoringRound, isUltraMax, modeId, state.status]);

  useEffect(() => {
    if (isRestoringRound || !hasTimer || state.status !== "playing") return;

    let previousTimestamp = performance.now();
    const intervalId = window.setInterval(() => {
      const timestamp = performance.now();
      const elapsedSeconds = (timestamp - previousTimestamp) / 1000;
      previousTimestamp = timestamp;
      setState(engine.advanceTime(elapsedSeconds).state);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [engine, hasTimer, isRestoringRound, state.status]);

  useEffect(() => {
    if (!state.timer) return;

    const currentSeconds = state.timer.remainingSeconds;
    const threshold = getCrossedUltraUrgencyThreshold(
      previousTimerSeconds.current,
      currentSeconds,
    );
    previousTimerSeconds.current = currentSeconds;
    if (threshold === null) return;

    if (!prefersReducedMotion) {
      const urgencyMotion = getUrgencyMotion(threshold);
      void urgencyControls.start(urgencyMotion);
    }
    const warningCue =
      threshold === 10 ? "warning-10" : threshold === 5 ? "warning-5" : null;
    void Promise.allSettled([
      warningCue ? adapters.audio.play(warningCue) : Promise.resolve(),
      threshold <= 10 ? adapters.haptics.impact(threshold === 5 ? "medium" : "light") : Promise.resolve(),
      adapters.analytics.track("urgency_threshold_reached", {
        mode: modeId,
        remainingSeconds: threshold,
      }),
    ]);
  }, [adapters, modeId, prefersReducedMotion, state.timer, urgencyControls]);

  useEffect(() => {
    if (!state.timer || state.status !== "playing") return;

    const currentSecond = Math.ceil(state.timer.remainingSeconds);
    const previousSecond = previousCountdownSecond.current;
    previousCountdownSecond.current = currentSecond;
    if (currentSecond >= previousSecond || currentSecond <= 0 || currentSecond >= 5) return;

    void adapters.audio.play("countdown");
  }, [adapters.audio, state.status, state.timer]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA"
      ) return;
      if (!normalizeLetter(event.key)) return;
      stableHandleGuess(event.key);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stableHandleGuess]);

  useEffect(() => {
    if (isRestoringRound || (state.status !== "won" && state.status !== "lost")) return;

    const won = state.status === "won";
    if (!completionFeedbackPlayed.current && !prefersReducedMotion) {
      void puzzleControls.start(
        won
          ? {
              filter: ["brightness(1)", "brightness(1.35)", "brightness(1.08)"],
              scale: [1, 1.025, 1],
              transition: { duration: 0.5, ease: "easeOut" },
            }
          : {
              filter: ["brightness(1)", "brightness(0.72)", "brightness(0.88)"],
              scale: [1, 0.992, 1],
              transition: { duration: 0.42, ease: "easeOut" },
            },
      );
    }
    if (!completionFeedbackPlayed.current) {
      completionFeedbackPlayed.current = true;
      void Promise.allSettled([
        adapters.audio.play(won ? "win" : "lose"),
        adapters.haptics.notification(won ? "success" : "error"),
        adapters.analytics.track("round_completed", {
          mode: modeId,
          category: selectedCategoryId,
          region: regionPreference,
          result: state.status,
          score: state.score.total,
          wordId: state.word.id,
        }),
      ]);
    }

    const query = new URLSearchParams({
      outcome: state.status,
      mode: modeId,
      category: selectedCategoryId,
      region: regionPreference,
      wordId: state.word.id,
      attempts: String(state.remainingAttempts),
      score: String(state.score.total),
      breakdown: JSON.stringify(state.score),
    });
    completionResult.current ??= recordLocalCompletedRound(adapters.storage, {
      roundId: state.roundId,
      mode: modeId,
      genre: state.genre,
      regionPreference,
      outcome: state.status,
      score: state.score.total,
      accuracyPercent: state.score.accuracyPercent,
      wrongGuesses: state.score.wrongGuesses,
      remainingTimeSeconds: state.score.remainingTimeSeconds,
      completedAt: state.completedAt ?? state.updatedAt,
    });

    let active = true;
    let timeoutId: number | null = null;
    void completionResult.current.then((result) => {
      if (!active) return;
      setAchievementUnlocks(result.unlockedAchievements);
      const unlockDelay = result.unlockedAchievements.length > 0
        ? 1_900 + Math.min(3, result.unlockedAchievements.length) * 450
        : 750;
      timeoutId = window.setTimeout(() => {
        void clearActiveRound(adapters.storage, roundToken)
          .catch(() => undefined)
          .finally(() => router.replace(`/results?${query.toString()}`, { scroll: false }));
      }, unlockDelay);
    }).catch(() => {
      if (!active) return;
      timeoutId = window.setTimeout(() => {
        void clearActiveRound(adapters.storage, roundToken)
          .catch(() => undefined)
          .finally(() => router.replace(`/results?${query.toString()}`, { scroll: false }));
      }, 750);
    });

    return () => {
      active = false;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [adapters, isRestoringRound, modeId, prefersReducedMotion, puzzleControls, regionPreference, roundToken, router, selectedCategoryId, state.completedAt, state.genre, state.remainingAttempts, state.roundId, state.score, state.status, state.updatedAt, state.word.id]);

  function handleSolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = engine.solveWord(solveInput);
    setSolveInput("");
    applyGuessResult(result);
  }

  function handleHint(hintKind: HintKind) {
    const result = engine.useHint(hintKind);
    setState(result.state);

    if (result.outcome !== "revealed") {
      setFeedback(GAME_COPY.hints.unavailable);
      setFeedbackTone("neutral");
      return;
    }

    const revealedContent =
      result.hintKind === "show-category"
        ? `${GAME_COPY.hints.categoryPrefix}: ${CATEGORIES_BY_ID[result.state.genre].name}`
        : result.hintKind === "reveal-letter"
          ? `${result.revealedLetter ?? ""} ${GAME_COPY.hints.letterSuffix}`
          : result.text;
    setHintContent(revealedContent);
    setFeedback(
      result.cost?.type === "none"
        ? GAME_COPY.hints.freeActivated
        : `${GAME_COPY.hints.paidActivated} ${result.cost ? describeHintCost(result.cost) : ""}`,
    );
    setFeedbackTone("neutral");
    void Promise.allSettled([
      adapters.audio.play("hint"),
      adapters.haptics.impact("light"),
      adapters.analytics.track("hint_used", {
        cost: result.cost?.type ?? "unknown",
        hintKind: result.hintKind,
        mode: modeId,
        wordId: state.word.id,
      }),
    ]);
  }

  function applyGuessResult(result: GuessResult) {
    setState(result.state);

    if (result.outcome === "correct") {
      const previousMultiplier = getUltraComboMultiplier(result.previousState.streak.current);
      const nextMultiplier = getUltraComboMultiplier(result.state.streak.current);
      const comboAdvanced = isUltra && nextMultiplier > previousMultiplier;
      const correctLine = pickCopyLine(GAME_COPY.gameplay.correct, result.state.turn);
      setFeedback(
        result.kind === "word"
          ? GAME_COPY.gameplay.solved
          : isUltra && result.state.streak.current >= 2
            ? `${correctLine} ${result.newlyRevealed} OPEN · ×${nextMultiplier}`
            : `${correctLine} ${result.newlyRevealed} OPEN.`,
      );
      setFeedbackTone("correct");
      if (!prefersReducedMotion) {
        void puzzleControls.start({
          filter: ["brightness(1)", "brightness(1.16)", "brightness(1)"],
          scale: [1, 1.008, 1],
          transition: { duration: 0.34 },
        });
        void comboControls.start({
          filter: comboAdvanced
            ? ["brightness(1)", "brightness(1.45)", "brightness(1)"]
            : ["brightness(1)", "brightness(1.15)", "brightness(1)"],
          scale: comboAdvanced ? [1, 1.08, 1] : [1, 1.025, 1],
          transition: { duration: comboAdvanced ? 0.46 : 0.28 },
        });
      }
      void Promise.allSettled([
        adapters.audio.play("correct-letter"),
        comboAdvanced ? adapters.audio.play("combo") : Promise.resolve(),
        adapters.haptics.impact(comboAdvanced && nextMultiplier >= 2 ? "medium" : "light"),
      ]);
      return;
    }

    if (result.outcome === "incorrect") {
      const comboBroken = isUltra && result.previousState.streak.current >= 2;
      const wrongLine = pickCopyLine(
        result.kind === "word"
          ? GAME_COPY.gameplay.incorrectAnswer
          : GAME_COPY.gameplay.incorrectLetter,
        result.state.turn,
      );
      setFeedback(
        comboBroken ? `${wrongLine} ${GAME_COPY.gameplay.comboReset}` : wrongLine,
      );
      setFeedbackTone("incorrect");
      if (!prefersReducedMotion) {
        void stageControls.start({
          x: [0, -3, 3, -1, 0],
          transition: { duration: 0.24, ease: "easeOut" },
        });
        if (comboBroken) {
          void comboControls.start({
            opacity: [1, 0.45, 1],
            x: [0, -2, 2, 0],
            transition: { duration: 0.3 },
          });
        }
      }
      void Promise.allSettled([
        adapters.audio.play("incorrect-letter"),
        adapters.haptics.impact("medium"),
      ]);
      return;
    }

    setFeedbackTone("neutral");
    setFeedback(
      result.outcome === "already-guessed"
        ? GAME_COPY.gameplay.duplicate
        : result.outcome === "invalid"
          ? result.kind === "word"
            ? GAME_COPY.gameplay.invalidAnswer
            : GAME_COPY.gameplay.invalidLetter
          : GAME_COPY.gameplay.roundComplete,
    );
  }

  useEffect(() => {
    guessHandlerRef.current = (letter) => {
      if (!isRestoringRound) applyGuessResult(engine.guessLetter(letter));
    };
  });

  const categoryRevealed = state.hints.usages.some((usage) => usage.kind === "show-category");
  const categoryLabel =
    mode.rules.categoryVisibility === "always" || state.status === "ready" || categoryRevealed
      ? CATEGORIES_BY_ID[state.genre].name
      : GAME_COPY.gameplay.labels.classified;
  const timerProgress = state.timer
    ? (state.timer.remainingSeconds / state.timer.durationSeconds) * 100
    : 0;
  return (
    <div
      className="game-mode-surface relative flex flex-1 flex-col"
      data-mode-intensity={modeAssets.uiTreatment?.intensity ?? "calm"}
      data-urgency={urgencyLevel}
      style={modeStyle}
    >
      <AnimatePresence>
        {!isRestoringRound && state.status === "ready" && activeModifier ? (
          <UltraMaxModifierReveal
            categoryId={state.genre}
            key={state.roundId}
            modifier={activeModifier}
            onComplete={beginUltraMaxRound}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {state.status === "won" || state.status === "lost" ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-live="assertive"
            className="game-round-outcome"
            data-outcome={state.status}
            exit={{ opacity: 0 }}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            key={state.status}
            role="status"
            transition={{ duration: 0.18 }}
          >
            <motion.p
              animate={{ opacity: 1, scale: 1, y: 0 }}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, scale: state.status === "won" ? 0.9 : 1.04, y: 8 }
              }
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {state.status === "won"
                ? GAME_COPY.gameplay.solved
                : GAME_COPY.results.loss.heading}
            </motion.p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {achievementUnlocks.length > 0 ? (
          <AchievementUnlockOverlay
            key={achievementUnlocks.map(({ definition }) => definition.id).join("-")}
            unlocks={achievementUnlocks}
          />
        ) : null}
      </AnimatePresence>
      <ModeBackdrop config={modeAssets} fallbackBackground={gameTheme.background} />
      <FlowHeader backHref={`/play/${modeId}/${regionPreference}`} logoAsset={gameTheme.logo} />

      <motion.div
        animate={stageControls}
        className="gameplay-layout mx-auto flex w-full max-w-5xl flex-1 flex-col"
      >
        <header className={`game-round-header ${state.timer ? "game-round-header-timed" : ""}`}>
          <RoundMeta label={GAME_COPY.gameplay.labels.category} value={categoryLabel} />
          <RoundMeta label={GAME_COPY.gameplay.labels.mode} value={mode.label} />
          {state.timer ? (
            <motion.div
              animate={urgencyControls}
              aria-label={`${Math.ceil(state.timer.remainingSeconds)} seconds remaining`}
              className="game-timer"
              data-urgency={urgencyLevel}
              role="timer"
            >
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-center gap-2">
                  <p className="game-meta-label">{GAME_COPY.gameplay.labels.timer}</p>
                  {urgencyLevel !== "steady" ? (
                    <AnimatePresence mode="wait">
                      <motion.span
                        animate={{ opacity: 1, y: 0 }}
                        className="game-urgency-label"
                        initial={{ opacity: 0, y: 3 }}
                        key={urgencyLevel}
                      >
                        {getUrgencyLabel(urgencyLevel)}
                      </motion.span>
                    </AnimatePresence>
                  ) : null}
                  {state.modifierState?.id === "time-attack" && state.modifierState.accelerated ? (
                    <span className="game-urgency-label">
                      {GAME_COPY.gameplay.urgency.timeAttack}
                    </span>
                  ) : null}
                </div>
                <AnimatePresence mode="popLayout">
                  <motion.p
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`font-mono text-2xl font-black leading-none ${state.timer.remainingSeconds <= 10 ? "text-[var(--danger)]" : "text-[var(--accent)]"}`}
                    initial={prefersReducedMotion ? false : { opacity: 0.55, scale: 1.12, y: -2 }}
                    key={Math.ceil(state.timer.remainingSeconds)}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    {Math.ceil(state.timer.remainingSeconds)}s
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="mt-2 h-1 overflow-hidden bg-[var(--border)]">
                <motion.div
                  animate={{ width: `${Math.max(0, timerProgress)}%` }}
                  aria-hidden="true"
                  className={`h-full ${state.timer.remainingSeconds <= 10 ? "bg-[var(--danger)]" : "bg-[var(--accent)]"}`}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "linear" }}
                />
              </div>
              <span aria-atomic="true" aria-live="assertive" className="sr-only">
                {urgencyLevel === "steady"
                  ? ""
                  : `${getUrgencyLabel(urgencyLevel)} timer warning.`}
              </span>
            </motion.div>
          ) : null}
        </header>

        <div className="gameplay-stage grid min-w-0">
          <GameArtworkSlot
            incorrectGuesses={incorrectGuessCount}
            maximumIncorrectGuesses={state.maximumAttempts}
            status={state.status}
            themeId={gameTheme.id}
          />

          <motion.section animate={puzzleControls} className="game-puzzle-stage">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="game-meta-label">{GAME_COPY.gameplay.labels.puzzle}</p>
                {isUltraMax && activeModifier ? (
                  <p className="mt-1 font-mono text-[8px] font-black uppercase tracking-[0.14em] text-[var(--danger)]">
                    {activeModifier.id.replaceAll("-", " ")}
                  </p>
                ) : null}
              </div>
              {isUltra ? (
                <motion.div animate={comboControls} className="game-combo-wrap w-36 sm:w-44">
                  <UltraComboMeter
                    consecutiveCorrect={state.streak.current}
                    multiplier={comboMultiplier}
                  />
                </motion.div>
              ) : null}
            </div>
            <div className="game-puzzle-content flex flex-1 flex-col items-center justify-center">
              <PuzzleAnswer maskedAnswer={visibleAnswers.primary} />
              {visibleAnswers.secondary ? (
                <>
                  <div aria-hidden="true" className="double-trouble-divider">
                    <span />
                    <b>{GAME_COPY.gameplay.labels.linkedAnswer}</b>
                    <span />
                  </div>
                  <PuzzleAnswer maskedAnswer={visibleAnswers.secondary} />
                </>
              ) : null}
            </div>
            <div
              aria-atomic="true"
              aria-live="polite"
              className="game-feedback-slot"
              role="status"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="game-feedback"
                  data-tone={feedbackTone}
                  exit={{ opacity: 0, y: -3 }}
                  initial={
                    prefersReducedMotion
                      ? false
                      : {
                          opacity: 0,
                          scale: feedbackTone === "incorrect" ? 0.98 : 1,
                          y: 4,
                        }
                  }
                  key={`${state.turn}-${feedback}`}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {feedback}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.section>
        </div>

        <section className="game-keyboard-section" aria-label="Guess a letter">
          <div className="game-keyboard-heading flex items-center justify-between gap-4 px-1">
            <p className="game-meta-label">{GAME_COPY.gameplay.labels.guessLetter}</p>
            <p className="hidden font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--muted)] sm:block">
              {GAME_COPY.gameplay.labels.keyboardReady}
            </p>
          </div>
          <GuessKeyboard
            alphabet={roundAlphabet}
            disabled={isRestoringRound || state.status !== "playing"}
            forgottenIncorrectLetters={forgottenIncorrectLetters}
            guessedLetters={state.guessedLetters}
            incorrectLetters={visibleIncorrectLetters}
            onGuess={stableHandleGuess}
          />
        </section>

        <form className="game-solve-form" onSubmit={handleSolve}>
          <input
            aria-label="Solve the full answer"
            className="game-solve-input min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[var(--muted)] focus:outline-none"
            disabled={isRestoringRound || state.status !== "playing"}
            onChange={(event) => setSolveInput(event.target.value)}
            placeholder={GAME_COPY.gameplay.labels.solvePlaceholder}
            value={solveInput}
          />
          <motion.button
            className="game-solve-button rounded-lg bg-white text-[10px] font-black tracking-[0.14em] text-black transition-colors hover:bg-[var(--accent)] disabled:opacity-35"
            disabled={!solveInput.trim() || isRestoringRound || state.status !== "playing"}
            type="submit"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.025 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            {GAME_COPY.gameplay.labels.solve}
          </motion.button>
        </form>

        <div className="game-status-grid">
          <section className="game-status-panel game-attempt-panel" aria-label="Remaining attempts">
            <p className="game-meta-label">{GAME_COPY.gameplay.labels.attempts}</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <AnimatePresence mode="popLayout">
                <motion.p
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  aria-atomic="true"
                  aria-label={`${state.remainingAttempts} of ${state.maximumAttempts} lives remaining`}
                  aria-live="polite"
                  className="font-mono text-3xl font-black leading-none"
                  exit={{ opacity: 0, scale: 0.8, y: 5 }}
                  initial={{ opacity: 0, scale: 1.18, y: -5 }}
                  key={state.remainingAttempts}
                >
                  {state.remainingAttempts}
                  <span className="text-sm text-[var(--muted)]">/{state.maximumAttempts}</span>
                </motion.p>
              </AnimatePresence>
              <AttemptPips
                reducedMotion={Boolean(prefersReducedMotion)}
                remaining={state.remainingAttempts}
                total={state.maximumAttempts}
              />
            </div>
          </section>

          <section className="game-status-panel game-hint-panel" aria-label="Hint">
            <HintControl
              modeId={modeId}
              onConfirm={handleHint}
              options={isRestoringRound ? [] : hintOptions}
              remainingAttempts={state.remainingAttempts}
              remainingTimeSeconds={state.timer?.remainingSeconds ?? null}
              revealedContent={hintContent}
            />
          </section>

          <section className="game-status-panel game-score-panel" aria-label="Current score">
            <div className="flex items-start justify-between gap-4">
              <p className="game-meta-label">{GAME_COPY.gameplay.labels.score}</p>
              <span className="font-mono text-[8px] font-black uppercase tracking-[0.14em] text-[var(--accent)]">
                {mode.rules.scoreMultiplier}× {GAME_COPY.gameplay.labels.modeMultiplierSuffix}
              </span>
            </div>
            <p className="mt-3 font-mono text-3xl font-black leading-none text-[var(--accent)]">
              <AnimatedNumber duration={0.3} value={state.score.total} />
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

function RoundMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="game-round-meta">
      <p className="game-meta-label">{label}</p>
      <p className="mt-1 truncate text-base font-black uppercase tracking-[-0.02em] sm:text-lg">
        {value}
      </p>
    </div>
  );
}

function AttemptPips({
  reducedMotion,
  remaining,
  total,
}: {
  reducedMotion: boolean;
  remaining: number;
  total: number;
}) {
  return (
    <div aria-hidden="true" className="flex flex-wrap justify-end gap-1.5">
      {Array.from({ length: total }, (_, index) => (
        <motion.span
          animate={{
            opacity: index < remaining ? 1 : 0.22,
            scale: reducedMotion ? 1 : index < remaining ? 1 : 0.72,
          }}
          className={`size-2 rounded-full ${index < remaining ? "bg-[var(--danger)]" : "bg-[var(--muted)]"}`}
          key={index}
        />
      ))}
    </div>
  );
}

function buildAlphabet(displayAnswer: string): readonly string[] {
  const extras = [...displayAnswer]
    .map((character) => normalizeLetter(character))
    .filter((letter): letter is string => letter !== null && !BASE_ALPHABET.includes(letter));

  return [...BASE_ALPHABET, ...new Set(extras)];
}

function getUrgencyLabel(level: UltraUrgencyLevel): string {
  switch (level) {
    case "alert":
      return GAME_COPY.gameplay.urgency.alert;
    case "urgent":
      return GAME_COPY.gameplay.urgency.urgent;
    case "critical":
      return GAME_COPY.gameplay.urgency.critical;
    case "final":
      return GAME_COPY.gameplay.urgency.final;
    default:
      return "";
  }
}

function getUrgencyMotion(threshold: UltraUrgencyThreshold) {
  switch (threshold) {
    case 30:
      return {
        filter: ["brightness(1)", "brightness(1.16)", "brightness(1)"],
        transition: { duration: 0.5 },
      };
    case 15:
      return {
        boxShadow: [
          "0 0 0 rgba(255, 92, 101, 0)",
          "0 0 28px rgba(255, 92, 101, 0.14)",
          "0 0 0 rgba(255, 92, 101, 0)",
        ],
        transition: { duration: 0.62 },
      };
    case 10:
      return {
        scale: [1, 1.018, 1],
        transition: { duration: 0.42 },
      };
    case 5:
      return {
        x: [0, -2, 2, -1, 0],
        transition: { duration: 0.34 },
      };
  }
}
