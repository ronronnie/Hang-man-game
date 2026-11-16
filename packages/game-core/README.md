# @hangman/game-core

Platform-independent domain package for the game. It contains the base Hangman engine, domain types, word selection, answer normalization, and extension contracts for future mechanics.

This package may depend on plain TypeScript and cross-platform contracts, but it must not depend on React, Next.js, React Native, DOM APIs, storage APIs, or animation libraries.

```ts
import { createCategoryWordPool, createGameEngine } from "@hangman/game-core";

const wordPool = createCategoryWordPool(words, "movies");

const engine = createGameEngine({
  words: wordPool,
  maximumAttempts: 6,
});

const result = engine.guessLetter("A");

if (result.state.status === "won") {
  // Let the client decide how to render, animate, persist, or announce the win.
}
```

Time, randomness, and round ID generation can be injected for deterministic tests and seeded challenges. Guess results contain immutable previous/current snapshots and domain events that future scoring, achievements, and mode-specific layers can consume.

## Categories

Card-ready category metadata lives in `src/config/categories.ts`. Icon and artwork values are platform-neutral identifiers, so web and mobile clients can map them to their own assets and components.

Category selection is deliberately outside the game engine. `createCategoryWordPool` resolves a direct category—or all enabled direct categories for Surprise Me—into a `WordEntry[]`. That pool is then supplied to `createGameEngine`, which only applies game and difficulty rules.

## Difficulty modes

All mode balancing lives in `src/config/modes.ts`:

| Mode | Attempts | Timer | Wrong-guess time penalty | Word pool | Score |
| --- | ---: | ---: | ---: | --- | ---: |
| I Know This Game | 7 | None | None | Difficulty 1–3 | 1x |
| Ultra | 5 | 60s | 5s | Difficulty 3–4 | 2x |
| Ultra Max | 4 | 45s | 7s | Difficulty 4–5 | 4x |

The engine never creates a timer. A client advances timed rounds by calling `advanceTime(elapsedSeconds)`, which keeps the rules reusable in browsers, React Native, tests, and background-safe orchestration.

Ultra Max selects one weighted modifier per round. Every modifier has its own typed factory and configuration in `src/modifiers/mechanics`; changing or disabling one mechanic does not alter the others. The selected modifier and its frozen configuration are included in `GameState.modifiers` for modifier-specific state layers to consume.
