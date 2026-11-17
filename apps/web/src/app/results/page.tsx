import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  LOCAL_WORD_DATASET,
  isCategoryId,
  isGameModeId,
} from "@hangman/game-core";

import { ResultsScreen } from "@/screens/results-screen";

interface ResultsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const query = await searchParams;
  const outcome = singleValue(query.outcome);
  const mode = singleValue(query.mode);
  const category = singleValue(query.category);
  const wordId = singleValue(query.wordId);
  const attempts = Number(singleValue(query.attempts));

  if (
    (outcome !== "won" && outcome !== "lost") ||
    !isGameModeId(mode) ||
    !isCategoryId(category) ||
    !wordId ||
    !Number.isInteger(attempts) ||
    attempts < 0
  ) {
    notFound();
  }

  const word = LOCAL_WORD_DATASET.find((entry) => entry.id === wordId);
  if (!word) notFound();

  return (
    <ResultsScreen
      categoryId={category}
      modeId={mode}
      outcome={outcome}
      remainingAttempts={attempts}
      word={word}
    />
  );
}

function singleValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}
