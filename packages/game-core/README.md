# @hangman/game-core

Platform-independent domain package for the game. It contains the base Hangman engine, domain types, word selection, answer normalization, and extension contracts for future mechanics.

This package may depend on plain TypeScript and cross-platform contracts, but it must not depend on React, Next.js, React Native, DOM APIs, storage APIs, or animation libraries.

```ts
import {
  LOCAL_WORD_DATASET,
  createCategoryWordPool,
  createGameEngine,
} from "@hangman/game-core";

const wordPool = createCategoryWordPool(LOCAL_WORD_DATASET, "movies", {
  regionPreference: "india",
});

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

Category and content-region selection are deliberately outside the game engine. `createCategoryWordPool` resolves a direct category—or all enabled direct categories for Surprise Me—and applies the India, USA, or Mixed preference before supplying a `WordEntry[]` to the engine.

## Local dataset

`src/words/data` exposes 680 entries through `LOCAL_WORD_DATASET`, including 320 new India-focused entries. Movies, Music, Sports, Geography, Science, Books, and General Knowledge each add 40 India entries; TV adds 32; Video Games deliberately adds 8 verified, recognizable India-developed titles rather than padding the pool. Every catalog entry has a region, hint, and platform-neutral metadata.

Region preferences are content choices only: India selects India + Global, USA selects USA + Global, and Mixed selects all three regions. No platform or geolocation APIs are used.

Difficulty uses the semantic tiers `easy`, `medium`, `hard`, and `brutal`. The complete dataset is distributed approximately 25%, 35%, 25%, and 15% across those tiers.

## Difficulty modes

All mode balancing lives in `src/config/modes.ts`:

| Mode | Attempts | Timer | Wrong-guess time penalty | Word pool | Score |
| --- | ---: | ---: | ---: | --- | ---: |
| I Know This Game | 7 | None | None | Easy + medium | 1x |
| Ultra | 5 | 60s | 5s | Medium + hard | 2x |
| Ultra Max | 4 | 45s | 7s | Hard + brutal | 4x |

The engine never creates a timer. A client advances timed rounds by calling `advanceTime(elapsedSeconds)`, which keeps the rules reusable in browsers, React Native, tests, and background-safe orchestration.

Ultra Max selects one weighted modifier per round. Every modifier has its own typed factory and configuration in `src/modifiers/mechanics`; changing or disabling one mechanic does not alter the others. The selected modifier and its frozen configuration are included in `GameState.modifiers` for modifier-specific state layers to consume.

## Daily challenge

`dailyChallengeGenerator.generate("YYYY-MM-DD")` deterministically selects the mode, concrete genre, region-compatible answer, and—when the mode is Ultra Max—one modifier. Generators may be configured with India, USA, or Mixed; Mixed remains the default while the feature is disabled. The seed is derived only from the date, a fixed namespace, and `DAILY_CHALLENGE_CONTENT_VERSION`; it does not use the current clock, browser state, or random system APIs. Double Trouble challenges also pin their second answer.

The content version is part of the public challenge identity. Bump it deliberately when changing the dataset or selection rules, and deploy the same version to every client that should receive the same challenge.

Attempt transitions also live here as pure functions. Starting a challenge immediately marks its single official attempt as consumed; completion may then record `won` or `lost` exactly once. Clients persist that history through their own storage adapter. The web client uses LocalStorage, while a future Expo client can use its native storage implementation without changing daily challenge rules.

The release switch is `dailyChallengeEnabled` in `src/config/features.ts` and is currently `false`.
