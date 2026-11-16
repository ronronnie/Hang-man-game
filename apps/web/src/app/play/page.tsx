import type { Metadata } from "next";

import { GameSetupScreen } from "@/screens/game-setup-screen";

export const metadata: Metadata = { title: "Choose a game" };

export default function PlayPage() {
  return <GameSetupScreen />;
}
