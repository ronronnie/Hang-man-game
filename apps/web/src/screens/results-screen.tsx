"use client";

import {
  CATEGORIES_BY_ID,
  GAME_COPY,
  GAME_MODES_BY_ID,
  REGION_PREFERENCES_BY_ID,
  type CategoryId,
  type GameModeId,
  type ScoreBreakdown,
  type RegionPreference,
  type WordEntry,
} from "@hangman/game-core";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

import { AnimatedNumber } from "@/components/game/animated-number";
import { GameLogo } from "@/components/navigation/game-logo";
import { TransitionItem } from "@/components/transitions/screen-transition";
import { usePlatformAdapters } from "@/hooks/use-platform-adapters";

const MotionLink = motion.create(Link);

interface ResultsScreenProps {
  categoryId: CategoryId;
  modeId: GameModeId;
  outcome: "won" | "lost";
  remainingAttempts: number;
  regionPreference: RegionPreference;
  score: ScoreBreakdown;
  word: WordEntry;
}

export function ResultsScreen(props: ResultsScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="results-screen flex flex-1 flex-col" data-outcome={props.outcome}>
      <motion.div
        animate={{ opacity: 1, scaleX: 1 }}
        aria-hidden="true"
        className="results-outcome-line"
        initial={prefersReducedMotion ? false : { opacity: 0, scaleX: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      />
      <TransitionItem>
        <GameLogo />
      </TransitionItem>

      {props.outcome === "won" ? <WinResult {...props} /> : <LossResult {...props} />}
    </div>
  );
}

function WinResult({ categoryId, modeId, regionPreference, score, word }: ResultsScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const mode = GAME_MODES_BY_ID[modeId];
  const category = CATEGORIES_BY_ID[word.genre];

  return (
    <main className="results-layout results-layout-win">
      <TransitionItem className="results-intro">
        <p className="results-kicker">{GAME_COPY.results.win.kicker}</p>
        <motion.p
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="results-outcome-heading"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 12 }}
          transition={{ delay: 0.08, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          {GAME_COPY.results.win.heading}
        </motion.p>
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="results-answer"
          data-density={word.displayAnswer.length > 22 ? "compact" : "normal"}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
          transition={{ delay: 0.18, duration: 0.28 }}
        >
          {word.displayAnswer}
        </motion.h1>
      </TransitionItem>

      <TransitionItem className="results-scoreboard">
        <div className="results-score-hero">
          <div>
            <p className="results-label">{GAME_COPY.results.win.score}</p>
            <p className="results-score-number">
              <AnimatedNumber duration={0.8} initialValue={0} value={score.total} />
            </p>
          </div>
          <div className="results-round-tags">
            <span>{mode.label}</span>
            <span>{category.name}</span>
            <span>{REGION_PREFERENCES_BY_ID[regionPreference].label}</span>
          </div>
        </div>

        <div className="results-stat-row">
          <ResultMetric label={GAME_COPY.results.win.accuracy} value={`${score.accuracyPercent}%`} />
          <ResultMetric
            label={GAME_COPY.results.win.time}
            value={
              score.remainingTimeSeconds === null
                ? GAME_COPY.results.win.untimed
                : `${Math.ceil(score.remainingTimeSeconds)}s`
            }
          />
          <ResultMetric label={GAME_COPY.results.win.combo} value={`×${score.comboMultiplier}`} />
        </div>
      </TransitionItem>

      <TransitionItem className="results-rewards" delay={0.08}>
        <div className="results-rewards-heading">
          <p className="results-label">{GAME_COPY.results.win.highlights}</p>
          <p>{GAME_COPY.results.win.highlightsSupporting}</p>
        </div>
        <div className="results-reward-list">
          {score.perfectSolve ? (
            <RewardLine
              label={GAME_COPY.results.rewards.perfect}
              value={`+${formatNumber(score.perfectSolveBonus)}`}
            />
          ) : null}
          {score.timeBonus > 0 ? (
            <RewardLine
              label={GAME_COPY.results.rewards.time}
              value={`+${formatNumber(score.timeBonus)}`}
            />
          ) : null}
          <RewardLine
            label={`${mode.label} ${GAME_COPY.results.rewards.multiplier}`}
            value={`×${score.modeMultiplier}`}
          />
          {score.earlySolve ? (
            <RewardLine
              label={GAME_COPY.results.rewards.early}
              value={`+${formatNumber(score.earlySolveBonus)}`}
            />
          ) : null}
          {score.clutch ? (
            <RewardLine
              label={GAME_COPY.results.rewards.clutch}
              tone="danger"
              value={`+${formatNumber(score.clutchBonus)}`}
            />
          ) : null}
          {score.hintPenalty > 0 ? (
            <RewardLine
              label={`${GAME_COPY.results.rewards.hint} · ${score.hintPenaltyPercent}%`}
              tone="danger"
              value={`−${formatNumber(score.hintPenalty)}`}
            />
          ) : null}
        </div>
      </TransitionItem>

      <ResultActions
        categoryId={categoryId}
        modeId={modeId}
        regionPreference={regionPreference}
        primaryLabel={GAME_COPY.results.win.playAgain}
        wordId={word.id}
        withModeChange
      />
    </main>
  );
}

function LossResult({ categoryId, modeId, regionPreference, score, word }: ResultsScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const completionPercent = Math.max(
    0,
    Math.min(100, (1 - score.remainingLetters / Math.max(1, score.wordLength)) * 100),
  );

  return (
    <main className="results-layout results-layout-loss">
      <TransitionItem className="results-intro">
        <p className="results-kicker">{GAME_COPY.results.loss.kicker}</p>
        <motion.p
          animate={{ opacity: 1, x: 0 }}
          className="results-outcome-heading"
          initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
          transition={{ delay: 0.08, duration: 0.36, ease: "easeOut" }}
        >
          {GAME_COPY.results.loss.heading}
        </motion.p>
        <h1
          className="results-answer"
          data-density={word.displayAnswer.length > 22 ? "compact" : "normal"}
        >
          {word.displayAnswer}
        </h1>
        <p className="results-encouragement">
          {GAME_COPY.results.loss.encouragement}
        </p>
      </TransitionItem>

      <TransitionItem className="loss-scoreboard">
        <div className="loss-score-total">
          <p className="results-label">{GAME_COPY.results.loss.score}</p>
          <p>
            <AnimatedNumber duration={0.62} initialValue={0} value={score.total} />
          </p>
        </div>
        <div className="loss-stat-grid">
          <ResultMetric label={GAME_COPY.results.loss.letters} value={String(score.lettersGuessed)} />
          <ResultMetric label={GAME_COPY.results.loss.mistakes} value={String(score.wrongGuesses)} />
          <ResultMetric label={GAME_COPY.results.loss.remaining} value={String(score.remainingLetters)} />
          <ResultMetric label={GAME_COPY.results.loss.accuracy} value={`${score.accuracyPercent}%`} />
        </div>
        <div
          aria-label={`${Math.round(completionPercent)} percent of the answer revealed`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(completionPercent)}
          className="loss-progress"
          role="progressbar"
        >
          <motion.span
            animate={{ width: `${completionPercent}%` }}
            initial={prefersReducedMotion ? false : { width: 0 }}
            transition={{ delay: 0.2, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </TransitionItem>

      <ResultActions
        categoryId={categoryId}
        modeId={modeId}
        regionPreference={regionPreference}
        primaryLabel={GAME_COPY.results.loss.tryAnother}
        wordId={word.id}
      />
    </main>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="result-metric">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function RewardLine({
  label,
  tone = "accent",
  value,
}: {
  label: string;
  tone?: "accent" | "danger";
  value: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="results-reward-line"
      data-tone={tone}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98, x: -6 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
    >
      <span>{label}</span>
      <b>{value}</b>
    </motion.div>
  );
}

function ResultActions({
  categoryId,
  modeId,
  regionPreference,
  primaryLabel,
  withModeChange = false,
  wordId,
}: {
  categoryId: CategoryId;
  modeId: GameModeId;
  regionPreference: RegionPreference;
  primaryLabel: string;
  withModeChange?: boolean;
  wordId: string;
}) {
  const adapters = usePlatformAdapters();
  const prefersReducedMotion = useReducedMotion();

  return (
    <TransitionItem className="results-actions" delay={0.14}>
      <MotionLink
        className="results-action-primary"
        href={`/play/${modeId}/${regionPreference}/${categoryId}?exclude=${encodeURIComponent(wordId)}`}
        onClick={() => void adapters.audio.play("button-click")}
        onMouseEnter={() => void adapters.audio.play("button-hover")}
        whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.015 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97, y: 0 }}
      >
        {primaryLabel}
        <span aria-hidden="true">→</span>
      </MotionLink>
      <MotionLink
        className="results-action-secondary"
        href={`/play/${modeId}/${regionPreference}`}
        onClick={() => void adapters.audio.play("button-click")}
        onMouseEnter={() => void adapters.audio.play("button-hover")}
        whileHover={prefersReducedMotion ? undefined : { y: -1 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      >
        {GAME_COPY.results.win.changeGenre}
      </MotionLink>
      {withModeChange ? (
        <MotionLink
          className="results-action-secondary"
          href="/play"
          onClick={() => void adapters.audio.play("button-click")}
          onMouseEnter={() => void adapters.audio.play("button-hover")}
          whileHover={prefersReducedMotion ? undefined : { y: -1 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
        >
          {GAME_COPY.results.win.changeMode}
        </MotionLink>
      ) : null}
      <MotionLink
        className="results-action-secondary"
        href={`/play/${modeId}`}
        onClick={() => void adapters.audio.play("button-click")}
        onMouseEnter={() => void adapters.audio.play("button-hover")}
        whileHover={prefersReducedMotion ? undefined : { y: -1 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
      >
        {GAME_COPY.results.win.changeRegion}
      </MotionLink>
    </TransitionItem>
  );
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
