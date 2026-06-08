# Stash Tracker

Manage your cannabis collection offline, on any device.

**Live:** https://robonator9000.github.io/Stash-Tracker/

## Features

- **Inventory** — strains with name, brand, type (Indica/Sativa/Hybrid or custom), THC/CBD, rating, price, notes, photos. Sort/filter by name, rating, THC, amount, price, favorites, stock status.
- **Consumption** — quick-add buttons (+0.1g, +0.25g, +0.5g, +1g, +2g) or manual input. Backdate consumption time. Track remaining amounts and last-consumed dates.
- **Low Stock Alerts** — set a gram threshold; a toast appears when a product drops below it.
- **Session Mode** — timed sessions with hit timer, bowl calculator, grams-per-bowl, session notes, rotation tracking per person.
- **Stats** — totals for products, amount, sessions, avg rating, THC, value, last-consumed. Toggle visibility per stat.
- **Favorites** — star products, filter by favorites, always sorted first.
- **Data Backup** — export/import JSON. Merge imports, export CSV, copy to clipboard.
- **PIN Lock** — secure data with 4-6 digit PIN.
- **Multi-Language** — English, Español, Français, Deutsch, Português.
- **Dark & Light Themes** — toggle in settings.
- **Customization** — currency ($/€/£/¥/₿), decimal precision (0-3), stat visibility, session defaults, low stock threshold.
- **PWA** — install on phone/desktop. Works offline via service worker.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build          # production build to dist/
npm run build:pages    # GitHub Pages build
```

Deploys automatically from `main` via `.github/workflows/deploy-pages.yml`.

## Testing

```bash
pip install playwright
playwright install chromium
python scripts/with_server.py \
  --server "cd /path/to/Stash-Tracker && npm run dev" --port 5173 \
  -- python /path/to/Stash-Tracker/scripts/test_app.py
```

Tests cover: welcome modal, language selection, products CRUD, consume/sell, low stock alerts, settings, filters, search, favorites, theme toggle, empty state. 64 assertions.

## Dev Notes

Built with React 19, TypeScript, Vite, Tailwind CSS, localStorage, Lucide React, Playwright. All data stays on your device.
