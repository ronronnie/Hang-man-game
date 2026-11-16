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

## Next engine phase

Implement the game state machine under `packages/game-core/src/engine`. It should accept all nondeterministic inputs—such as time, random seeds, and selected words—as values or injected interfaces. Engine transitions should return a new immutable state plus domain events. Persistence, sound, haptics, analytics, sharing, React state, and navigation remain responsibilities of client orchestration code.

Recommended first tests:

1. Game creation is deterministic for a seed and configuration.
2. Letter normalization and duplicate guesses are validated.
3. Correct and incorrect guesses produce the expected immutable transition.
4. Win, loss, pause, resume, and abandon transitions reject invalid actions.
5. Each mode, hint, scoring policy, and modifier is independently testable.
