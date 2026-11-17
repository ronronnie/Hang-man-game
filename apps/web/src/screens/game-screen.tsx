"use client";

import {
  CATEGORIES_BY_ID,
  GAME_MODES_BY_ID,
  createGameEngine,
  isGuessableCharacter,
  normalizeLetter,
  type CategoryId,
  type GameModeId,
  type GameState,
  type GuessResult,
  type WordEntry,
} from "@hangman/game-core";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { FlowHeader } from "@/components/navigation/flow-header";
import { usePlatformAdapters } from "@/hooks/use-platform-adapters";

const BASE_ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

interface GameScreenProps {
  modeId: GameModeId;
  selectedCategoryId: CategoryId;
  word: WordEntry;
}

export function GameScreen({ modeId, selectedCategoryId, word }: GameScreenProps) {
  const router = useRouter();
  const adapters = usePlatformAdapters();
  const [engine] = useState(() => createGameEngine({ words: [word], mode: modeId }));
  const [state, setState] = useState<Readonly<GameState>>(() => engine.getState());
  const [feedback, setFeedback] = useState("Pick a letter or solve the whole answer.");
  const [solveInput, setSolveInput] = useState("");
  const mode = GAME_MODES_BY_ID[modeId];
  const alphabet = useMemo(() => buildAlphabet(word.displayAnswer), [word.displayAnswer]);
  const hasTimer = state.timer !== null;

  useEffect(() => {
    if (!hasTimer || state.status !== "playing") return;

    let previousTimestamp = performance.now();
    const intervalId = window.setInterval(() => {
      const timestamp = performance.now();
      const elapsedSeconds = (timestamp - previousTimestamp) / 1000;
      previousTimestamp = timestamp;
      setState(engine.advanceTime(elapsedSeconds).state);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [engine, hasTimer, state.status]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (!normalizeLetter(event.key)) return;
      handleGuess(event.key);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    if (state.status !== "won" && state.status !== "lost") return;

    const won = state.status === "won";
    void Promise.allSettled([
      adapters.audio.play(won ? "round-won" : "round-lost"),
      adapters.haptics.notification(won ? "success" : "error"),
      adapters.analytics.track("round_completed", {
        mode: modeId,
        category: selectedCategoryId,
        result: state.status,
        wordId: word.id,
      }),
    ]);

    const query = new URLSearchParams({
      outcome: state.status,
      mode: modeId,
      category: selectedCategoryId,
      wordId: word.id,
      attempts: String(state.remainingAttempts),
    });
    const timeoutId = window.setTimeout(() => {
      router.replace(`/results?${query.toString()}`, { scroll: false });
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [adapters, modeId, router, selectedCategoryId, state.remainingAttempts, state.status, word.id]);

  function handleGuess(letter: string) {
    const result = engine.guessLetter(letter);
    applyGuessResult(result);
  }

  function handleSolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = engine.solveWord(solveInput);
    setSolveInput("");
    applyGuessResult(result);
  }

  function applyGuessResult(result: GuessResult) {
    setState(result.state);

    if (result.outcome === "correct") {
      setFeedback(result.kind === "word" ? "Solved." : `${result.newlyRevealed} revealed.`);
      void Promise.allSettled([
        adapters.audio.play("correct-guess"),
        adapters.haptics.impact("light"),
      ]);
      return;
    }

    if (result.outcome === "incorrect") {
      setFeedback(result.kind === "word" ? "Not the answer." : "Wrong. Keep moving.");
      void Promise.allSettled([
        adapters.audio.play("incorrect-guess"),
        adapters.haptics.impact("medium"),
      ]);
      return;
    }

    setFeedback(
      result.outcome === "already-guessed"
        ? "Already tried."
        : result.outcome === "invalid"
          ? "Enter one letter."
          : "Round complete.",
    );
  }

  const categoryLabel =
    mode.rules.categoryVisibility === "always"
      ? CATEGORIES_BY_ID[state.genre].name
      : "Category classified";

  return (
    <div className="flex flex-1 flex-col">
      <FlowHeader backHref={`/play/${modeId}`} />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col py-7 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
              {mode.label}
            </p>
            <p className="mt-1 text-sm font-bold">{categoryLabel}</p>
          </div>
          <div className="flex items-center gap-5 text-right">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Attempts
              </p>
              <p className="mt-1 font-mono text-lg font-black">
                {state.remainingAttempts}
                <span className="text-[var(--muted)]">/{state.maximumAttempts}</span>
              </p>
            </div>
            {state.timer ? (
              <div className="min-w-16">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--muted)]">
                  Time
                </p>
                <p
                  className={`mt-1 font-mono text-lg font-black ${state.timer.remainingSeconds <= 10 ? "text-[var(--danger)]" : "text-[var(--accent)]"}`}
                >
                  {Math.ceil(state.timer.remainingSeconds)}s
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <PuzzleAnswer maskedAnswer={state.maskedAnswer} />
          <p aria-live="polite" className="mt-5 min-h-5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            {feedback}
          </p>
        </div>

        <div className="space-y-5">
          <div className="mx-auto grid max-w-3xl grid-cols-7 gap-1.5 sm:grid-cols-9">
            {alphabet.map((letter) => {
              const guessed = state.guessedLetters.includes(letter);
              const incorrect = state.incorrectLetters.includes(letter);

              return (
                <button
                  aria-label={`Guess ${letter}`}
                  className={`aspect-square rounded-lg border text-xs font-black transition-colors sm:text-sm ${
                    guessed
                      ? incorrect
                        ? "border-transparent bg-[var(--danger)]/10 text-[var(--danger)] opacity-55"
                        : "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-white hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                  disabled={guessed || state.status !== "playing"}
                  key={letter}
                  onClick={() => handleGuess(letter)}
                  type="button"
                >
                  {letter}
                </button>
              );
            })}
          </div>

          <form className="mx-auto flex max-w-xl gap-2" onSubmit={handleSolve}>
            <input
              aria-label="Solve the full answer"
              className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
              disabled={state.status !== "playing"}
              onChange={(event) => setSolveInput(event.target.value)}
              placeholder="Know it? Solve the full answer"
              value={solveInput}
            />
            <button
              className="rounded-xl bg-white px-5 py-3 text-xs font-black tracking-[0.12em] text-black transition-colors hover:bg-[var(--accent)] disabled:opacity-40"
              disabled={!solveInput.trim() || state.status !== "playing"}
              type="submit"
            >
              SOLVE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PuzzleAnswer({ maskedAnswer }: { maskedAnswer: string }) {
  return (
    <div
      aria-label={`Puzzle: ${maskedAnswer}`}
      className="flex max-w-full flex-wrap justify-center gap-x-5 gap-y-4"
      role="img"
    >
      {maskedAnswer.split(" ").map((part, wordIndex) => (
        <span className="flex gap-1" key={`${part}-${wordIndex}`}>
          {[...part].map((character, characterIndex) => (
            <span
              className={`grid h-10 min-w-6 place-items-center border-b-2 text-xl font-black uppercase sm:h-12 sm:min-w-8 sm:text-2xl ${
                character === "_" || isGuessableCharacter(character)
                  ? "border-[var(--accent)] text-white"
                  : "border-transparent text-[var(--muted)]"
              }`}
              key={`${character}-${characterIndex}`}
            >
              {character === "_" ? "" : character}
            </span>
          ))}
        </span>
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
