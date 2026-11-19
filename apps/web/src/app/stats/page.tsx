import type { Metadata } from "next";

import { StatisticsScreen } from "@/screens/statistics-screen";

export const metadata: Metadata = { title: "Stats" };

export default function StatsPage() {
  return <StatisticsScreen />;
}
