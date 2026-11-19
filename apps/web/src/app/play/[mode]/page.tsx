import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isGameModeId } from "@hangman/game-core";

import { RegionSelectionScreen } from "@/screens/region-selection-screen";

interface CategoryPageProps {
  params: Promise<{ mode: string }>;
}

export const metadata: Metadata = { title: "Select Region" };

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { mode } = await params;
  if (!isGameModeId(mode)) notFound();

  return <RegionSelectionScreen modeId={mode} />;
}
