# Architecture

## Dependency direction

```text
apps/web  ───────► packages/game-core
    │
    └────────────► packages/shared

future apps/mobile will depend on the same two packages
```

Dependencies flow from clients toward framework-free packages. `game-core` must never import client code.

## Package responsibilities

- `@hangman/game-core`: domain types, stable configuration, validation, engine contracts, and future pure gameplay implementation.
- `@hangman/shared`: platform adapter contracts and utilities that are not game rules.
- `@hangman/web`: Next.js routing, React screens and components, Tailwind styling, Framer Motion animation definitions, and browser adapter implementations.

The adapter contracts are asynchronous so both browser and React Native implementations can conform without leaking platform behavior into game logic.

## Game engine

The base state machine lives under `packages/game-core/src/engine`. It accepts nondeterministic inputs—time, randomness, and round IDs—through injected functions. Guess operations return immutable previous/current state snapshots plus domain events. Persistence, sound, haptics, analytics, sharing, React state, and navigation remain responsibilities of client orchestration code.

The engine currently covers:

1. Difficulty-based word selection with exclusions from a client-supplied pool.
2. Phrase masking with automatic spaces and punctuation.
3. Letter and full-answer guesses, including invalid and duplicate input.
4. Attempt tracking and win/loss transitions.
5. Same-word resets and newly selected rounds.

Mode-specific hints, scoring, Ultra rules, and Ultra Max modifiers should consume these states and events rather than adding platform behavior to the engine.

Mode balancing is centralized in `packages/game-core/src/config/modes.ts`. The engine reads attempts, timer rules, difficulty ranges, and modifier-selection policy from this configuration. Ultra Max modifier definitions live separately under `packages/game-core/src/modifiers/mechanics`, allowing each mechanic to be configured and tested independently while the mode configuration controls which definitions are eligible.

## Category boundary

Category metadata is centralized in `packages/game-core/src/config/categories.ts`. Definitions use semantic icon and artwork identifiers instead of React components or browser assets, keeping them reusable by the future mobile client.

`packages/game-core/src/categories` translates a category choice into a word pool. Direct categories filter to their own entries; Surprise Me combines entries from every enabled direct category. Client orchestration passes that resulting pool to the engine. The engine never branches on a category or contains Surprise Me behavior, and `GameState.genre` records only the concrete category of the selected word.

## Local content

The initial test content lives under `packages/game-core/src/words/data`, split into one module per category. A small `defineWords` factory adds the concrete category and shared metadata while still producing ordinary `WordEntry` objects. The aggregate catalog exports all entries or a category-indexed view, allowing both web and future mobile clients to use the same local content without importing client code.

Difficulty is a domain label rather than a numeric implementation detail: `easy`, `medium`, `hard`, or `brutal`. Mode configuration declares the eligible labels, and the engine applies those rules to whichever category pool the client supplies.
