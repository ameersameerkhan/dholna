# Architecture

Dholna is a static, single-view React application. The code is intentionally small: React owns the interface and state, Canvas 2D owns the scene transition, and YouTube owns media playback through its IFrame API.

## Runtime shape

### App and state

`src/App.tsx` composes the experience. `src/appState.ts` contains the reducer and state transitions used across the UI.

There is no external state-management dependency.

### Scenes

`src/scene/` owns the visual scene and the Canvas transition between day and night. Responsive asset selection is handled in `src/hooks/`, while the source filenames live in `src/config/scenes.ts`.

The four production images are static files in `public/scenes/`.

### Music

`src/player/YouTubePlayerBridge.ts` is the boundary around the YouTube IFrame Player API. It owns player commands and translates YouTube state into the small set of events the app needs.

`src/player/MusicConsole.tsx` renders the player controls. The active day and night video IDs live in `src/config/tracks.ts`.

Dholna stores IDs only. No audio files are shipped by the repository.

### Chrome and About

`src/chrome/` contains the wordmark, status and maker attribution. `src/about/` contains the About journey modal and its accessibility behaviour.

### Styling

`src/styles/` contains the CSS tokens and component styles. There is no CSS framework.

## Maintainer tooling

`tools/` contains the track curator, low-level track verifier and a small reserve list. These files are served by Vite during local development but are not part of the production Dholna interface.

The Playwright track-verification suite uses `tools/track-verifier.html` to check YouTube embeddability and playback.

## Tests

- Vitest covers reducer logic, player behaviour, scene logic and UI components.
- Playwright provides the browser smoke layer.
- A separate Playwright configuration verifies active and reserve YouTube IDs when run manually.

## Deployment

`npm run build` produces the static site in `dist/`.

`.github/workflows/ci.yml` runs tests and the production build. `.github/workflows/pages.yml` deploys `main` to GitHub Pages after its own test/build gate.
