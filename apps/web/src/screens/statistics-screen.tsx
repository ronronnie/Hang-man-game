"use client";

import {
  CATEGORIES,
  GAME_COPY,
  GAME_MODES,
  REGION_PREFERENCE_DEFINITIONS,
  type CategoryDefinition,
  type PlayableCategoryId,
  type PlayerStatLine,
} from "@hangman/game-core";
import Link from "next/link";

import { FlowHeader } from "@/components/navigation/flow-header";
import { TransitionItem } from "@/components/transitions/screen-transition";
import { usePlayerStatistics } from "@/hooks/use-player-statistics";

const PLAYABLE_CATEGORIES = CATEGORIES.filter(
  (category): category is CategoryDefinition & { id: PlayableCategoryId } =>
    category.id !== "surprise-me",
);

export function StatisticsScreen() {
  const { loaded, statistics } = usePlayerStatistics();
  const overall = statistics.overall;

  return (
    <div className="flex flex-1 flex-col">
      <TransitionItem>
        <FlowHeader backHref="/" />
      </TransitionItem>
      <main className="stats-screen-layout">
        <TransitionItem className="stats-heading-row">
          <div>
            <p className="stats-eyebrow">{GAME_COPY.statistics.eyebrow}</p>
            <h1>{GAME_COPY.statistics.heading}</h1>
            <p className="stats-supporting">{GAME_COPY.statistics.supporting}</p>
          </div>
          <Link className="stats-achievement-link" href="/achievements">
            {GAME_COPY.achievements.eyebrow}
            <span aria-hidden="true">→</span>
          </Link>
        </TransitionItem>

        {!loaded || overall.gamesPlayed > 0 ? (
          <>
            <TransitionItem className="stats-scoreboard" delay={0.05}>
              <div className="stats-scoreboard-lead">
                <p>{GAME_COPY.statistics.overall}</p>
                <strong>{loaded ? overall.gamesPlayed : "—"}</strong>
                <span>games played</span>
              </div>
              <div className="stats-metric-grid">
                <StatMetric label="Games won" value={loaded ? overall.gamesWon : "—"} />
                <StatMetric label="Win rate" value={loaded ? formatPercent(overall.winRate) : "—"} />
                <StatMetric label="Highest score" value={loaded ? formatNumber(overall.highestScore) : "—"} />
                <StatMetric label="Current streak" value={loaded ? overall.currentStreak : "—"} />
                <StatMetric label="Best streak" value={loaded ? overall.highestStreak : "—"} />
                <StatMetric label="Perfect games" value={loaded ? overall.perfectGames : "—"} />
                <StatMetric label="Average accuracy" value={loaded ? formatPercent(overall.averageAccuracy) : "—"} />
              </div>
            </TransitionItem>

            <TransitionItem className="stats-breakdown" delay={0.1}>
              <h2>{GAME_COPY.statistics.byMode}</h2>
              <div className="stats-breakdown-grid stats-breakdown-modes">
                {GAME_MODES.map((mode) => (
                  <BreakdownCard key={mode.id} label={mode.label} stats={statistics.byMode[mode.id]} />
                ))}
              </div>
            </TransitionItem>

            <TransitionItem className="stats-breakdown" delay={0.14}>
              <h2>{GAME_COPY.statistics.byRegion}</h2>
              <div className="stats-breakdown-grid stats-breakdown-modes">
                {REGION_PREFERENCE_DEFINITIONS.map((region) => (
                  <BreakdownCard
                    key={region.id}
                    label={region.label}
                    stats={statistics.byRegion[region.id]}
                  />
                ))}
              </div>
            </TransitionItem>

            <TransitionItem className="stats-breakdown" delay={0.18}>
              <h2>{GAME_COPY.statistics.byGenre}</h2>
              <div className="stats-breakdown-grid">
                {PLAYABLE_CATEGORIES.map((category) => (
                  <BreakdownCard
                    key={category.id}
                    label={category.name}
                    stats={statistics.byGenre[category.id]}
                  />
                ))}
              </div>
            </TransitionItem>
          </>
        ) : (
          <TransitionItem className="stats-empty" delay={0.05}>
            <p>{GAME_COPY.statistics.empty}</p>
            <Link href="/play">Play now <span aria-hidden="true">→</span></Link>
          </TransitionItem>
        )}
      </main>
    </div>
  );
}

function StatMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stats-metric">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function BreakdownCard({ label, stats }: { label: string; stats: Readonly<PlayerStatLine> }) {
  return (
    <article className="stats-breakdown-card" data-active={stats.gamesPlayed > 0 ? "true" : "false"}>
      <h3>{label}</h3>
      <strong>{stats.gamesWon}<span>/{stats.gamesPlayed}</span></strong>
      <div>
        <span>{formatPercent(stats.winRate)} win</span>
        <span>{formatPercent(stats.averageAccuracy)} accuracy</span>
        <span>{formatNumber(stats.highestScore)} high</span>
      </div>
    </article>
  );
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}
