# Hangman Game

This repository is an npm workspace organized around a platform-independent game domain.

```text
apps/
  web/          Next.js web client
packages/
  game-core/    Game types, configuration, contracts, and future engine
  shared/       Cross-platform ports and utilities
```

## Commands

```bash
npm install
npm run dev
npm run test
npm run check
```

The web client is intentionally thin. The future React Native / Expo client should consume the same `@hangman/game-core` and `@hangman/shared` packages and provide its own platform adapter implementations.
