import { CATEGORIES } from "../config/categories";
import { GAME_MODES, GAME_MODES_BY_ID } from "../config/modes";
import { selectRoundModifier } from "../modifiers/modifier-selection";
import { ULTRA_MAX_MODIFIERS } from "../modifiers/registry";
import type { PlayableCategoryId } from "../types/category";
import type {
  BeginDailyChallengeAttemptResult,
  CompleteDailyChallengeAttemptResult,
  DailyChallenge,
  DailyChallengeAttempt,
  DailyChallengeGenerator,
  DailyChallengeHistory,
  DailyChallengeStatus,
} from "../types/daily-challenge";
import type { GameModeId } from "../types/mode";
import type { ModifierId } from "../types/modifier";
import type { WordDifficulty, WordEntry } from "../types/word";
import type { RegionPreference } from "../types/region";
import { filterWordsByRegion } from "../words/region-filter";
import { createSeededRandom } from "../utilities/random";
import { LOCAL_WORD_DATASET } from "../words/word-catalog";

export type {
  BeginDailyChallengeAttemptResult,
  CompleteDailyChallengeAttemptResult,
  DailyChallenge,
  DailyChallengeAttempt,
  DailyChallengeGenerator,
  DailyChallengeHistory,
  DailyChallengeStatus,
} from "../types/daily-challenge";

export const DAILY_CHALLENGE_CONTENT_VERSION = "v2-regions";
export const DAILY_CHALLENGE_NAMESPACE = "hangman-daily-challenge";

const PLAYABLE_CATEGORIES = CATEGORIES.filter(
  (category): category is (typeof category) & { id: PlayableCategoryId } =>
    category.enabled && category.selection === "direct",
);

export interface CreateDailyChallengeGeneratorOptions {
  words?: readonly WordEntry[];
  contentVersion?: string;
  namespace?: string;
  regionPreference?: RegionPreference;
}

function assertCalendarDate(date: string): void {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error("Daily challenge date must use YYYY-MM-DD format");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error("Daily challenge date must be a valid calendar date");
  }
}

/** Stable FNV-1a hash; intentionally avoids platform crypto and runtime entropy. */
export function hashDailyChallengeSeed(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function selectAtIndex<T>(values: readonly T[], random: () => number, label: string): T {
  const selected = values[Math.floor(random() * values.length)];
  if (selected === undefined) throw new Error(`No ${label} are available for the daily challenge`);
  return selected;
}

function selectModifier(modeId: GameModeId, random: () => number): ModifierId | null {
  const selection = GAME_MODES_BY_ID[modeId].rules.modifierSelection;
  if (!selection) return null;

  const selected = selectRoundModifier(ULTRA_MAX_MODIFIERS, selection.pool, random());
  if (!selected) throw new Error("No enabled Ultra Max modifier is available");
  return selected.id;
}

function selectSecondaryWord(
  primary: Readonly<WordEntry>,
  candidates: readonly WordEntry[],
  random: () => number,
): Readonly<WordEntry> {
  const connectionId = primary.metadata?.connectionId;
  const alternatives = candidates.filter((candidate) => candidate.id !== primary.id);
  const connected =
    connectionId === undefined
      ? []
      : alternatives.filter((candidate) => candidate.metadata?.connectionId === connectionId);
  return selectAtIndex(connected.length > 0 ? connected : alternatives, random, "secondary words");
}

export function createDailyChallengeGenerator(
  options: CreateDailyChallengeGeneratorOptions = {},
): DailyChallengeGenerator {
  const words = options.words ?? LOCAL_WORD_DATASET;
  const contentVersion = options.contentVersion ?? DAILY_CHALLENGE_CONTENT_VERSION;
  const namespace = options.namespace ?? DAILY_CHALLENGE_NAMESPACE;
  const regionPreference = options.regionPreference ?? "mixed";

  return Object.freeze({
    generate(date: string): DailyChallenge {
      assertCalendarDate(date);
      const seed = hashDailyChallengeSeed(
        `${namespace}:${contentVersion}:${regionPreference}:${date}`,
      );
      const random = createSeededRandom(seed);
      const mode = selectAtIndex(GAME_MODES, random, "modes");
      const category = selectAtIndex(PLAYABLE_CATEGORIES, random, "categories");
      const modifierId = selectModifier(mode.id, random);
      const allowedDifficulties: readonly WordDifficulty[] = mode.rules.wordPool.difficulties;
      const eligibleWords = filterWordsByRegion(words, regionPreference).filter(
        (word) =>
          word.genre === category.id && allowedDifficulties.includes(word.difficulty),
      );
      const primaryWord = selectAtIndex(eligibleWords, random, "eligible words");
      const selectedWords =
        modifierId === "double-trouble"
          ? [primaryWord, selectSecondaryWord(primaryWord, eligibleWords, random)]
          : [primaryWord];

      return Object.freeze({
        id: `daily:${contentVersion}:${regionPreference}:${date}`,
        date,
        contentVersion,
        seed,
        genreId: category.id,
        regionPreference,
        wordId: primaryWord.id,
        answer: primaryWord.answer,
        displayAnswer: primaryWord.displayAnswer,
        words: Object.freeze(selectedWords),
        modeId: mode.id,
        modifierId,
      });
    },
  });
}

export const dailyChallengeGenerator = createDailyChallengeGenerator();

export function createEmptyDailyChallengeHistory(): Readonly<DailyChallengeHistory> {
  return Object.freeze({ schemaVersion: 1, attemptsByDate: Object.freeze({}) });
}

export function normalizeDailyChallengeHistory(value: unknown): Readonly<DailyChallengeHistory> {
  if (!value || typeof value !== "object") return createEmptyDailyChallengeHistory();
  const candidate = value as Partial<DailyChallengeHistory>;
  if (
    candidate.schemaVersion !== 1 ||
    !candidate.attemptsByDate ||
    typeof candidate.attemptsByDate !== "object"
  ) {
    return createEmptyDailyChallengeHistory();
  }
  return Object.freeze({
    schemaVersion: 1,
    attemptsByDate: Object.freeze({ ...candidate.attemptsByDate }),
  });
}

export function getDailyChallengeAttempt(
  history: Readonly<DailyChallengeHistory>,
  date: string,
): Readonly<DailyChallengeAttempt> | null {
  return history.attemptsByDate[date] ?? null;
}

export function getDailyChallengeStatus(
  history: Readonly<DailyChallengeHistory>,
  date: string,
): DailyChallengeStatus {
  return getDailyChallengeAttempt(history, date)?.status ?? "not-attempted";
}

export function beginDailyChallengeAttempt(
  history: Readonly<DailyChallengeHistory>,
  challenge: Readonly<DailyChallenge>,
  startedAt: string,
): BeginDailyChallengeAttemptResult {
  const existing = getDailyChallengeAttempt(history, challenge.date);
  if (existing?.attempted) {
    return { allowed: false, history, attempt: existing, reason: "already-attempted" };
  }

  const attempt = Object.freeze({
    challengeId: challenge.id,
    date: challenge.date,
    attempted: true,
    status: "not-attempted" as const,
    startedAt,
    completedAt: null,
  });
  const nextHistory = Object.freeze({
    schemaVersion: 1 as const,
    attemptsByDate: Object.freeze({ ...history.attemptsByDate, [challenge.date]: attempt }),
  });
  return { allowed: true, history: nextHistory, attempt, reason: null };
}

export function completeDailyChallengeAttempt(
  history: Readonly<DailyChallengeHistory>,
  challenge: Readonly<DailyChallenge>,
  outcome: "won" | "lost",
  completedAt: string,
): CompleteDailyChallengeAttemptResult {
  const existing = getDailyChallengeAttempt(history, challenge.date);
  if (!existing?.attempted || existing.challengeId !== challenge.id) {
    return { completed: false, history, attempt: existing, reason: "attempt-not-started" };
  }
  if (existing.status !== "not-attempted") {
    return { completed: false, history, attempt: existing, reason: "already-completed" };
  }

  const attempt = Object.freeze({ ...existing, status: outcome, completedAt });
  const nextHistory = Object.freeze({
    schemaVersion: 1 as const,
    attemptsByDate: Object.freeze({ ...history.attemptsByDate, [challenge.date]: attempt }),
  });
  return { completed: true, history: nextHistory, attempt, reason: null };
}
