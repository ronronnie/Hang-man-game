import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { randomUUID } from "node:crypto";

import {
  LOCAL_WORD_DATASET,
  createCategoryWordPool,
  isCategoryId,
  isGameModeId,
  isRegionPreference,
} from "@hangman/game-core";

import { GameRoundBootstrap } from "@/gameplay/game-round-bootstrap";

interface GamePageProps {
  params: Promise<{ mode: string; genre: string; category: string }>;
  searchParams: Promise<{ exclude?: string | string[]; round?: string | string[] }>;
}

export const metadata: Metadata = { title: "Game" };

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const { mode, genre: region, category } = await params;
  if (!isGameModeId(mode) || !isRegionPreference(region) || !isCategoryId(category)) {
    notFound();
  }

  await connection();
  const { exclude, round } = await searchParams;
  const excludedWordIds = typeof exclude === "string" ? [exclude] : (exclude ?? []);
  const roundToken = typeof round === "string" ? round : null;
  if (!roundToken || !/^[A-Za-z0-9-]{8,80}$/.test(roundToken)) {
    const nextSearchParams = new URLSearchParams({ round: randomUUID() });
    excludedWordIds.forEach((wordId) => nextSearchParams.append("exclude", wordId));
    redirect(`/play/${mode}/${region}/${category}?${nextSearchParams.toString()}`);
  }

  const categoryPool = createCategoryWordPool(LOCAL_WORD_DATASET, category, {
    regionPreference: region,
  });
  if (categoryPool.length === 0) notFound();

  return (
    <GameRoundBootstrap
      excludedWordIds={excludedWordIds}
      modeId={mode}
      regionPreference={region}
      roundSeed={hashRoundToken(roundToken)}
      roundToken={roundToken}
      selectedCategoryId={category}
      wordPool={categoryPool}
    />
  );
}

function hashRoundToken(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
