import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isCategoryId, isGameModeId } from "@hangman/game-core";

import { GamePlaceholderScreen } from "@/screens/game-placeholder-screen";

interface GamePageProps {
  params: Promise<{ mode: string; genre: string }>;
}

export const metadata: Metadata = { title: "Game" };

export default async function GamePage({ params }: GamePageProps) {
  const { mode, genre } = await params;

  if (!isGameModeId(mode) || !isCategoryId(genre)) {
    notFound();
  }

  return <GamePlaceholderScreen modeId={mode} genreId={genre} />;
}
