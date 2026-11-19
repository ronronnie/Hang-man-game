"use client";

import { isGuessableCharacter } from "@hangman/game-core";
import { motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

export const PuzzleAnswer = memo(function PuzzleAnswer({ maskedAnswer }: { maskedAnswer: string }) {
  const prefersReducedMotion = useReducedMotion();
  const longestWordLength = Math.max(
    1,
    ...maskedAnswer.split(" ").map((word) => [...word].length),
  );
  const density = longestWordLength >= 14 ? "dense" : longestWordLength >= 10 ? "compact" : "normal";

  return (
    <div
      aria-label={describePuzzle(maskedAnswer)}
      className="puzzle-answer"
      data-density={density}
      role="img"
    >
      {maskedAnswer.split(" ").map((part, wordIndex) => (
        <span className="puzzle-word" key={`${part}-${wordIndex}`}>
          {[...part].map((character, characterIndex) => {
            const hidden = character === "_";
            const revealedLetter = !hidden && isGuessableCharacter(character);

            return (
              <motion.span
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="puzzle-character"
                data-hidden={hidden}
                data-revealed={revealedLetter}
                initial={
                  prefersReducedMotion || !revealedLetter
                    ? false
                    : { opacity: 0, scale: 0.72, y: 8 }
                }
                key={`${wordIndex}-${characterIndex}-${character}`}
                transition={{ type: "spring", stiffness: 430, damping: 24 }}
              >
                {hidden ? "" : character}
              </motion.span>
            );
          })}
        </span>
      ))}
    </div>
  );
});

function describePuzzle(maskedAnswer: string): string {
  const words = maskedAnswer.split(" ").map((word) =>
    [...word]
      .map((character) => {
        if (character === "_") return "blank";
        if (character === "?") return "unknown";
        return character;
      })
      .join(", "),
  );

  return `Puzzle. ${words.join(". Next word: ")}.`;
}
