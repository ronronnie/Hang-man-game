import type { WordEntry } from "../types/word";
import { isPlayableCategoryId } from "../validation/identifiers";

const GUESSABLE_CHARACTER = /^[\p{L}\p{N}]$/u;

export function isGuessableCharacter(character: string): boolean {
  return GUESSABLE_CHARACTER.test(character);
}

export function normalizeLetter(value: string): string | null {
  const normalized = value.trim().normalize("NFKC").toLocaleUpperCase("en-US");
  const characters = [...normalized];

  return characters.length === 1 && isGuessableCharacter(characters[0]) ? characters[0] : null;
}

/** Ignores spacing and punctuation, allowing `SPIDER MAN` to solve `SPIDER-MAN`. */
export function normalizeAnswer(value: string): string {
  return [...value.normalize("NFKC").toLocaleUpperCase("en-US")]
    .filter(isGuessableCharacter)
    .join("");
}

export function maskAnswer(displayAnswer: string, guessedLetters: readonly string[] = []): string {
  const guessed = new Set(guessedLetters.map((letter) => normalizeLetter(letter)).filter(Boolean));

  return [...displayAnswer]
    .map((character) => {
      if (!isGuessableCharacter(character)) return character;
      const normalized = normalizeLetter(character);
      return normalized && guessed.has(normalized) ? character : "_";
    })
    .join("");
}

export function countGuessableCharacters(value: string): number {
  return [...value].filter(isGuessableCharacter).length;
}

export function countOccurrences(displayAnswer: string, letter: string): number {
  const normalizedLetter = normalizeLetter(letter);
  if (!normalizedLetter) return 0;

  return [...displayAnswer].filter((character) => normalizeLetter(character) === normalizedLetter).length;
}

export function isAnswerComplete(displayAnswer: string, guessedLetters: readonly string[]): boolean {
  const guessed = new Set(guessedLetters.map((letter) => normalizeLetter(letter)).filter(Boolean));
  return [...displayAnswer].every((character) => {
    if (!isGuessableCharacter(character)) return true;
    const normalized = normalizeLetter(character);
    return normalized !== null && guessed.has(normalized);
  });
}

export function matchesWordAnswer(word: WordEntry, guess: string): boolean {
  const normalizedGuess = normalizeAnswer(guess);
  if (!normalizedGuess) return false;

  return [word.answer, ...(word.alternateAnswers ?? [])].some(
    (answer) => normalizeAnswer(answer) === normalizedGuess,
  );
}

export function validateWordEntry(word: WordEntry): void {
  if (!word.id.trim()) throw new Error("WordEntry.id must not be empty");
  const genre: string = word.genre;
  if (!isPlayableCategoryId(genre)) {
    throw new Error(`WordEntry "${word.id}" has an invalid playable genre`);
  }
  if (!Number.isInteger(word.difficulty) || word.difficulty < 1 || word.difficulty > 5) {
    throw new Error(`WordEntry "${word.id}" difficulty must be an integer from 1 to 5`);
  }

  const answer = normalizeAnswer(word.answer);
  const displayAnswer = normalizeAnswer(word.displayAnswer);

  if (!answer) throw new Error(`WordEntry "${word.id}" must contain at least one letter or number`);
  if (answer !== displayAnswer) {
    throw new Error(`WordEntry "${word.id}" answer and displayAnswer must represent the same answer`);
  }

  word.alternateAnswers?.forEach((alternateAnswer) => {
    if (!normalizeAnswer(alternateAnswer)) {
      throw new Error(`WordEntry "${word.id}" contains an empty alternate answer`);
    }
  });
}
