# Game theme assets

Each folder represents one replaceable game theme. The `default` theme is mapped in
`src/assets/game-themes.ts` and reserves these files:

- `background.webp`
- `logo.svg`
- `idle.webp`
- `wrong-guess-01.webp` through `wrong-guess-07.webp`
- `win.webp`
- `lose.webp`

The current manifest deliberately uses UI placeholders instead of image files. Add
the real file, then set the matching asset slot's `src` to its `replacementPath`.
No game component needs to change.
