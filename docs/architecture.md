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

1. Genre/difficulty-based word selection with exclusions.
2. Phrase masking with automatic spaces and punctuation.
3. Letter and full-answer guesses, including invalid and duplicate input.
4. Attempt tracking and win/loss transitions.
5. Same-word resets and newly selected rounds.

Mode-specific hints, scoring, Ultra rules, and Ultra Max modifiers should consume these states and events rather than adding platform behavior to the engine.

Mode balancing is centralized in `packages/game-core/src/config/modes.ts`. The engine reads attempts, timer rules, difficulty ranges, and modifier-selection policy from this configuration. Ultra Max modifier definitions live separately under `packages/game-core/src/modifiers/mechanics`, allowing each mechanic to be configured and tested independently while the mode configuration controls which definitions are eligible.
