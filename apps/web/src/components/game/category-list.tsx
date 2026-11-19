"use client";

import { CATEGORIES, GAME_COPY, type CategoryId, type GameModeId, type RegionPreference } from "@hangman/game-core";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { getCategoryAssets } from "@/assets";
import { ConfiguredVisualAsset } from "@/components/assets/configured-visual-asset";
import { CategoryIcon } from "@/components/game/category-icon";
import { usePlatformAdapters } from "@/hooks/use-platform-adapters";

const TILE_VARIANTS: Variants = {
  idle: { rotate: 0, scale: 1, y: 0 },
  hover: { rotate: -0.35, scale: 1.022, y: -6 },
  tap: { rotate: 0, scale: 0.985, y: -1 },
  selected: { rotate: -0.35, scale: 1.028, y: -6 },
};

interface CategoryListProps {
  modeId: GameModeId;
  regionPreference: RegionPreference;
}

export function CategoryList({ modeId, regionPreference }: CategoryListProps) {
  const router = useRouter();
  const adapters = usePlatformAdapters();
  const prefersReducedMotion = useReducedMotion();
  const navigationTimeout = useRef<number | null>(null);
  const selectionLocked = useRef(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);
  const enabledCategories = CATEGORIES.filter((category) => category.enabled);

  useEffect(
    () => () => {
      if (navigationTimeout.current !== null) window.clearTimeout(navigationTimeout.current);
    },
    [],
  );

  function selectCategory(categoryId: CategoryId) {
    if (selectionLocked.current || selectedCategoryId !== null) return;

    selectionLocked.current = true;
    setSelectedCategoryId(categoryId);
    void Promise.allSettled([
      adapters.audio.play("button-click"),
      adapters.haptics.impact(categoryId === "surprise-me" ? "medium" : "light"),
    ]);

    navigationTimeout.current = window.setTimeout(
      () => router.push(`/play/${modeId}/${regionPreference}/${categoryId}`, { scroll: false }),
      prefersReducedMotion ? 0 : 240,
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {enabledCategories.map((category, index) => {
        const presentation = getCategoryAssets(category.id);
        const selected = selectedCategoryId === category.id;
        const dimmed = selectedCategoryId !== null && !selected;
        const isSurprise = category.id === "surprise-me";
        const tileStyle = {
          "--category-accent": presentation.accent,
          "--category-background": presentation.background,
        } as CSSProperties;

        return (
          <motion.li
            animate={{
              opacity: dimmed ? 0.38 : 1,
              scale: prefersReducedMotion ? 1 : dimmed ? 0.975 : 1,
            }}
            className="min-w-0"
            key={category.id}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          >
            <motion.button
              animate={prefersReducedMotion ? "idle" : selected ? "selected" : "idle"}
              aria-label={`Play ${category.name}`}
              className={`category-tile group relative flex min-h-48 w-full flex-col overflow-hidden rounded-2xl p-4 text-left sm:min-h-56 sm:p-5 ${isSurprise ? "category-tile-surprise" : ""}`}
              data-selected={selected}
              disabled={selectedCategoryId !== null}
              onClick={() => selectCategory(category.id)}
              onMouseEnter={() => {
                router.prefetch(`/play/${modeId}/${regionPreference}/${category.id}`);
                void adapters.audio.play("button-hover");
              }}
              style={tileStyle}
              transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.68 }}
              type="button"
              variants={TILE_VARIANTS}
              whileHover={selectedCategoryId === null && !prefersReducedMotion ? "hover" : undefined}
              whileTap={selectedCategoryId === null && !prefersReducedMotion ? "tap" : undefined}
            >
              <span aria-hidden="true" className="category-tile-index">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div aria-hidden="true" className="category-tile-artwork">
                <motion.div
                  animate={
                    selected && !prefersReducedMotion
                      ? { rotate: [0, -2, 1, 0], scale: [1, 1.08, 1.04] }
                      : undefined
                  }
                  className="size-full"
                  transition={{ duration: 0.35 }}
                >
                  <ConfiguredVisualAsset
                    asset={presentation.artwork}
                    className="size-full"
                    decorative
                    sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
                  />
                </motion.div>
              </div>

              <div className="relative z-10 flex items-start justify-between gap-3">
                <span className="category-tile-icon">
                  <CategoryIcon icon={category.icon} />
                </span>
                <AnimatePresence>
                  {selected ? (
                    <motion.span
                      animate={{ opacity: 1, scale: 1 }}
                      className="category-tile-selected"
                      exit={{ opacity: 0, scale: 0.8 }}
                      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                    >
                      ✓
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="relative z-10 mt-auto">
                {isSurprise ? (
                  <p className="mb-2 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-[var(--category-accent)]">
                    {GAME_COPY.categorySelection.wildcard}
                  </p>
                ) : null}
                <h2 className="category-tile-title">{category.name}</h2>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {presentation.code}
                  </span>
                  <span
                    aria-hidden="true"
                    className="category-tile-arrow transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </div>
            </motion.button>
          </motion.li>
        );
      })}
    </ul>
  );
}
