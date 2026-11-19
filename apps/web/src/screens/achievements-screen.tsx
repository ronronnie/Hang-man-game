"use client";

import { ACHIEVEMENTS, GAME_COPY } from "@hangman/game-core";

import { FlowHeader } from "@/components/navigation/flow-header";
import { TransitionItem } from "@/components/transitions/screen-transition";
import { usePlayerStatistics } from "@/hooks/use-player-statistics";

export function AchievementsScreen() {
  const { loaded, statistics } = usePlayerStatistics();
  const progressById = new Map(
    statistics.achievements.map((progress) => [progress.achievementId, progress]),
  );

  return (
    <div className="flex flex-1 flex-col">
      <TransitionItem>
        <FlowHeader backHref="/" />
      </TransitionItem>
      <main className="achievement-screen-layout">
        <TransitionItem>
          <p className="stats-eyebrow">{GAME_COPY.achievements.eyebrow}</p>
          <h1>{GAME_COPY.achievements.heading}</h1>
          <p className="stats-supporting">{GAME_COPY.achievements.supporting}</p>
        </TransitionItem>

        <TransitionItem className="achievement-grid" delay={0.08}>
          {ACHIEVEMENTS.map((achievement, index) => {
            const progress = progressById.get(achievement.id);
            const unlocked = Boolean(progress?.unlockedAt);
            const current = Math.min(achievement.target, progress?.current ?? 0);

            return (
              <article
                className="achievement-card"
                data-unlocked={unlocked ? "true" : "false"}
                key={achievement.id}
              >
                <div className="achievement-card-topline">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <b>
                    {!loaded
                      ? "—"
                      : unlocked
                        ? GAME_COPY.achievements.earned
                        : GAME_COPY.achievements.locked}
                  </b>
                </div>
                <div className="achievement-card-mark" aria-hidden="true">
                  {unlocked ? "◆" : "◇"}
                </div>
                <h2>{achievement.title}</h2>
                <p>{achievement.description}</p>
                <div
                  aria-label={`${current} of ${achievement.target}`}
                  aria-valuemax={achievement.target}
                  aria-valuemin={0}
                  aria-valuenow={current}
                  className="achievement-progress"
                  role="progressbar"
                >
                  <span style={{ width: `${(current / achievement.target) * 100}%` }} />
                </div>
                <small>{current}/{achievement.target}</small>
              </article>
            );
          })}
        </TransitionItem>
      </main>
    </div>
  );
}
