import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isCategoryId, isGameModeId, isRegionPreference } from "@hangman/game-core";

import { CategorySelectionScreen } from "@/screens/category-selection-screen";

interface RegionPageProps {
  params: Promise<{ mode: string; genre: string }>;
}

export const metadata: Metadata = { title: "Select Category" };

export default async function RegionPage({ params }: RegionPageProps) {
  const { mode, genre: regionOrLegacyGenre } = await params;
  if (!isGameModeId(mode)) notFound();

  if (isRegionPreference(regionOrLegacyGenre)) {
    return <CategorySelectionScreen modeId={mode} regionPreference={regionOrLegacyGenre} />;
  }

  if (isCategoryId(regionOrLegacyGenre)) {
    redirect(`/play/${mode}/mixed/${regionOrLegacyGenre}`);
  }

  notFound();
}
