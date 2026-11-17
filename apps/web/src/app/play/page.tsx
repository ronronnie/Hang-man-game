import type { Metadata } from "next";

import { ModeSelectionScreen } from "@/screens/mode-selection-screen";

export const metadata: Metadata = { title: "Select Mode" };

export default function PlayPage() {
  return <ModeSelectionScreen />;
}
