# Stash-Tracker

A React progressive web app for tracking cannabis products, consumption sessions, and community strain sharing.

**Live app:** https://robonator9000.github.io/Stash-Tracker/

## Features

- Product inventory management with THC/CBD tracking
- Consumption logging and session timers
- Stats dashboard with customizable visibility
- Multi-language support (EN, ES, FR, DE, PT)
- Dark/light theme
- Community strain sharing
- Installable PWA with offline support

## Development

```bash
npm install
npm run dev
```

## Build

Local production build:

```bash
npm run build
```

GitHub Pages build (uses `/Stash-Tracker/` base path):

```bash
npm run build:pages
npm run preview:pages
```

Production output is written to `dist/`.

## GitHub Pages PWA

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/deploy-pages.yml`.

To enable Pages manually in the repo settings:

1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**

The app registers a service worker for offline caching and can be installed on mobile and desktop from the browser menu.

## Install as PWA

- **Android / Chrome:** open the live URL, then tap **Install app** or **Add to Home screen**
- **iOS / Safari:** tap **Share**, then **Add to Home Screen**
- **Desktop Chrome / Edge:** use the install icon in the address bar
