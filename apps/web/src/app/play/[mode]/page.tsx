import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isGameModeId } from "@hangman/game-core";

import { CategorySelectionScreen } from "@/screens/category-selection-screen";

interface CategoryPageProps {
  params: Promise<{ mode: string }>;
}

export const metadata: Metadata = { title: "Select Category" };

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { mode } = await params;
  if (!isGameModeId(mode)) notFound();

  return <CategorySelectionScreen modeId={mode} />;
}
