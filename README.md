# ProCam Ultra

A professional camera UI prototype built for Android phones. React + Vite + TypeScript + Tailwind CSS, packaged as a single-file HTML app for easy sideloading.

## Tech stack

- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/) + [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile)
- [TypeScript](https://www.typescriptlang.org/) (strict)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) icons

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (single-file `dist/index.html`) |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Vitest test suite |
| `npm run lint` | Run ESLint over `src` |

## Project structure

```
src/
  App.tsx                # Shell, tabs, bottom navigation
  main.tsx               # React entry point
  index.css              # Tailwind imports
  types/camera.ts        # Shared TypeScript types
  lib/modes.ts           # Single source of truth for shooting-mode metadata
  hooks/useCameraSettings.ts   # Camera state, presets, shutter/recording (localStorage persisted)
  components/
    Viewfinder.tsx       # Live camera viewfinder + shutter row
    ViewfinderOverlays.tsx     # Grid, focus peaking, zebra, horizon, EV scale
    ProControlBar.tsx    # Pro manual-control panels
    ModeCarousel.tsx     # Shooting-mode switcher
    ZoomSlider.tsx       # Log-scale zoom control
    GalleryView.tsx      # Shot gallery with detail view
    ShotLog.tsx          # Shooting-session log
    SettingsPanel.tsx    # Overlays, presets, video, system, geo settings
    Histogram.tsx        # Simulated live histogram
```

## Testing

Tests use [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) with `jsdom`. Run them with:

```sh
npm test
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and PR:

1. `npm ci` — install dependencies
2. `tsc --noEmit` — strict type-check
3. `npm run lint` — ESLint
4. `npm test` — test suite
5. `npm run build` — production build

## Notes

- The app is a frontend simulation: camera capture, image assets, and geolocation are mocked. No real device camera APIs are wired up.
- Settings and custom presets persist in `localStorage` and survive reloads.
