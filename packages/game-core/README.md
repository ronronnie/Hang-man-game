# @hangman/game-core

Platform-independent domain package for the game. It contains the base Hangman engine, domain types, word selection, answer normalization, and extension contracts for future mechanics.

This package may depend on plain TypeScript and cross-platform contracts, but it must not depend on React, Next.js, React Native, DOM APIs, storage APIs, or animation libraries.

```ts
import { createGameEngine } from "@hangman/game-core";

const engine = createGameEngine({
  words,
  genre: "movies",
  maximumAttempts: 6,
});

const result = engine.guessLetter("A");

if (result.state.status === "won") {
  // Let the client decide how to render, animate, persist, or announce the win.
}
```

Time, randomness, and round ID generation can be injected for deterministic tests and seeded challenges. Guess results contain immutable previous/current snapshots and domain events that future scoring, achievements, and mode-specific layers can consume.
