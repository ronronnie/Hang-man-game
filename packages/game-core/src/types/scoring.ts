export interface RoundMetrics {
  /** Valid player guesses only; hints never increment this value. */
  correctGuesses: number;
  /** Incorrect letter and full-answer guesses combined. */
  incorrectGuesses: number;
  fullWordSolveAttempts: number;
  solvedByFullWord: boolean;
  solvedEntireWordEarly: boolean;
}

/** Fully transparent score data shared by web and future mobile clients. */
export interface ScoreBreakdown {
  baseScore: number;
  startingBaseScore: number;
  wordLength: number;
  wordLengthBonus: number;
  progressMultiplier: number;
  difficultyMultiplier: number;
  modeMultiplier: number;
  remainingTimeSeconds: number | null;
  remainingTimeMultiplier: number;
  accuracyPercent: number;
  accuracyMultiplier: number;
  comboMultiplier: number;
  timeBonus: number;
  multipliedScore: number;
  lettersGuessed: number;
  remainingLetters: number;
  wrongGuesses: number;
  hintsUsed: number;
  hintPenaltyPercent: number;
  hintPenalty: number;
  earlySolve: boolean;
  earlySolveBonus: number;
  perfectSolve: boolean;
  perfectSolveBonus: number;
  clutch: boolean;
  clutchBonus: number;
  modifierBonus: number;
  total: number;
}

export interface StreakState {
  /** Consecutive correct guesses in the active round. */
  current: number;
  /** Highest consecutive-correct run reached in the active round. */
  best: number;
  lastCompletedDate?: string;
}
