"use client";

import { motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

interface GuessKeyboardProps {
  alphabet: readonly string[];
  disabled: boolean;
  guessedLetters: readonly string[];
  incorrectLetters: readonly string[];
  forgottenIncorrectLetters?: readonly string[];
  onGuess: (letter: string) => void;
}

export const GuessKeyboard = memo(function GuessKeyboard({
  alphabet,
  disabled,
  guessedLetters,
  incorrectLetters,
  forgottenIncorrectLetters = [],
  onGuess,
}: GuessKeyboardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div aria-label="Letter keyboard" className="game-keyboard" role="group">
      {alphabet.map((letter) => {
        const guessed = guessedLetters.includes(letter);
        const incorrect = incorrectLetters.includes(letter);
        const forgotten = forgottenIncorrectLetters.includes(letter);
        const state = guessed && !forgotten
          ? incorrect
            ? "selected-incorrect"
            : "selected-correct"
          : "available";
        const visuallyDisabled = disabled || (guessed && !forgotten);
        const accessibleState = disabled
          ? "unavailable"
          : state === "selected-correct"
            ? "correct guess"
            : state === "selected-incorrect"
              ? "incorrect guess"
              : "available";
        const stateMotion =
          state === "selected-correct"
            ? { scale: [1, 1.1, 1], y: [0, -3, 0] }
            : state === "selected-incorrect"
              ? { scale: [1, 0.94, 1], x: [0, -2, 2, 0] }
              : { scale: 1, x: 0, y: 0 };

        return (
          <motion.button
            animate={prefersReducedMotion ? undefined : stateMotion}
            aria-label={`${letter}, ${accessibleState}`}
            className="game-key"
            data-state={state}
            data-internally-guessed={guessed}
            disabled={visuallyDisabled}
            key={letter}
            onClick={() => onGuess(letter)}
            transition={{ duration: 0.24, ease: "easeOut" }}
            type="button"
            whileHover={!visuallyDisabled && !prefersReducedMotion ? { y: -3, scale: 1.045 } : undefined}
            whileTap={!visuallyDisabled && !prefersReducedMotion ? { scale: 0.92, y: 1 } : undefined}
          >
            <span className="game-key-letter">{letter}</span>
            {state !== "available" ? (
              <span aria-hidden="true" className="game-key-state-mark">
                {state === "selected-correct" ? "✓" : "×"}
              </span>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}, areGuessKeyboardPropsEqual);

function areGuessKeyboardPropsEqual(
  previous: Readonly<GuessKeyboardProps>,
  current: Readonly<GuessKeyboardProps>,
): boolean {
  return (
    previous.disabled === current.disabled &&
    previous.onGuess === current.onGuess &&
    arraysEqual(previous.alphabet, current.alphabet) &&
    arraysEqual(previous.guessedLetters, current.guessedLetters) &&
    arraysEqual(previous.incorrectLetters, current.incorrectLetters) &&
    arraysEqual(previous.forgottenIncorrectLetters ?? [], current.forgottenIncorrectLetters ?? [])
  );
}

function arraysEqual(previous: readonly string[], current: readonly string[]): boolean {
  return (
    previous.length === current.length &&
    previous.every((value, index) => value === current[index])
  );
}
