import type { Metadata } from "next";

import { AchievementsScreen } from "@/screens/achievements-screen";

export const metadata: Metadata = { title: "Achievements" };

export default function AchievementsPage() {
  return <AchievementsScreen />;
}
