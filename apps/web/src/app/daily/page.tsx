import type { Metadata } from "next";

import { DailyChallengeScreen } from "@/screens/daily-challenge-screen";

export const metadata: Metadata = { title: "Daily Challenge" };

export default function DailyPage() {
  return <DailyChallengeScreen />;
}
