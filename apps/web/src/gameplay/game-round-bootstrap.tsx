"use client";

import {
  GAME_MODES_BY_ID,
  PLAYABLE_CATEGORY_IDS,
  filterWordsByRegion,
  selectWordWithDifficultyFallback,
  type CategoryId,
  type GameModeId,
  type RegionPreference,
  type WordEntry,
  type WordId,
} from "@hangman/game-core";
import { useEffect, useState } from "react";

import { GameScreen } from "@/screens/game-screen";
import { usePlatformAdapters } from "@/hooks/use-platform-adapters";

import { loadActiveRound } from "./active-round-storage";
import { loadRecentWordIds, rememberWord, saveRecentWordIds } from "./recent-word-history";

interface GameRoundBootstrapProps {
  excludedWordIds: readonly WordId[];
  modeId: GameModeId;
  regionPreference: RegionPreference;
  roundSeed: number;
  roundToken: string;
  selectedCategoryId: CategoryId;
  wordPool: readonly WordEntry[];
}

export function GameRoundBootstrap(props: GameRoundBootstrapProps) {
  const adapters = usePlatformAdapters();
  const [word, setWord] = useState<WordEntry | null>(null);
  const {
    excludedWordIds,
    modeId,
    regionPreference,
    roundSeed,
    roundToken,
    selectedCategoryId,
    wordPool,
  } = props;

  useEffect(() => {
    let active = true;

    async function prepareRound() {
      const identity = {
        modeId,
        roundToken,
        selectedCategoryId,
        regionPreference,
      };
      const savedRound = await loadActiveRound(adapters.storage, identity);
      const savedWord = savedRound
        ? wordPool.find((entry) => entry.id === savedRound.state.word.id) ?? null
        : null;

      if (savedWord) {
        await rememberWord(
          adapters.storage,
          selectedCategoryId,
          regionPreference,
          savedWord.id,
          savedWord.genre,
        );
        if (active) setWord(savedWord);
        return;
      }

      const historyCategories = selectedCategoryId === "surprise-me"
        ? ["surprise-me", ...PLAYABLE_CATEGORY_IDS] as const
        : [selectedCategoryId] as const;
      const histories = await Promise.all(
        historyCategories.map((categoryId) =>
          loadRecentWordIds(adapters.storage, categoryId, regionPreference)),
      );
      const recentWordIds = [...new Set([...histories.flat(), ...excludedWordIds])];
      const difficulties = GAME_MODES_BY_ID[modeId].rules.wordPool.difficulties;
      const randomValue = seededRoundValue(roundSeed);
      const regionPool = filterWordsByRegion(wordPool, regionPreference);
      let selectedWord = selectWordWithDifficultyFallback(regionPool, {
        difficulties,
        excludeWordIds: recentWordIds,
        randomValue,
      });

      if (!selectedWord) {
        const eligibleIds = new Set(
          regionPool
            .filter((entry) => difficulties.includes(entry.difficulty))
            .map((entry) => entry.id),
        );
        const retainedHistory = recentWordIds.filter((id) => !eligibleIds.has(id));
        await saveRecentWordIds(
          adapters.storage,
          selectedCategoryId,
          regionPreference,
          retainedHistory,
        );
        selectedWord = selectWordWithDifficultyFallback(regionPool, {
          difficulties,
          excludeWordIds: excludedWordIds,
          randomValue,
        });
      }

      if (!selectedWord) throw new Error("No eligible word is available for this round");
      await rememberWord(
        adapters.storage,
        selectedCategoryId,
        regionPreference,
        selectedWord.id,
        selectedWord.genre,
      );
      if (active) setWord(selectedWord);
    }

    void prepareRound().catch(() => {
      const fallbackWord = selectWordWithDifficultyFallback(
        filterWordsByRegion(wordPool, regionPreference), {
        difficulties: GAME_MODES_BY_ID[modeId].rules.wordPool.difficulties,
        excludeWordIds: excludedWordIds,
        randomValue: seededRoundValue(roundSeed),
        },
      );
      if (active && fallbackWord) setWord(fallbackWord);
    });
    return () => {
      active = false;
    };
  }, [adapters.storage, excludedWordIds, modeId, regionPreference, roundSeed, roundToken, selectedCategoryId, wordPool]);

  if (!word) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="animate-pulse font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
          Loading challenge…
        </p>
      </div>
    );
  }

  return (
    <GameScreen
      modeId={modeId}
      regionPreference={regionPreference}
      roundSeed={roundSeed}
      roundToken={roundToken}
      selectedCategoryId={selectedCategoryId}
      word={word}
      wordPool={wordPool}
    />
  );
}

function seededRoundValue(seed: number): number {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
}
