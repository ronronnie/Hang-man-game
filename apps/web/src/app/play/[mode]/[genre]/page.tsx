import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { randomInt } from "node:crypto";

import {
  GAME_MODES_BY_ID,
  LOCAL_WORD_DATASET,
  createCategoryWordPool,
  isCategoryId,
  isGameModeId,
  selectWord,
} from "@hangman/game-core";

import { GameScreen } from "@/screens/game-screen";

interface GamePageProps {
  params: Promise<{ mode: string; genre: string }>;
  searchParams: Promise<{ exclude?: string | string[] }>;
}

export const metadata: Metadata = { title: "Game" };

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const { mode, genre } = await params;

  if (!isGameModeId(mode) || !isCategoryId(genre)) {
    notFound();
  }

  await connection();
  const { exclude } = await searchParams;
  const excludedWordIds = typeof exclude === "string" ? [exclude] : (exclude ?? []);
  const categoryPool = createCategoryWordPool(LOCAL_WORD_DATASET, genre);
  const word = selectWord(categoryPool, {
    difficulties: GAME_MODES_BY_ID[mode].rules.wordPool.difficulties,
    excludeWordIds: excludedWordIds,
    randomValue: randomInt(1_000_000) / 1_000_000,
  });

  if (!word) notFound();

  return <GameScreen modeId={mode} selectedCategoryId={genre} word={word} />;
}
