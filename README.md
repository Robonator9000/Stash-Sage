# 🌿 Stash Tracker

Manage your cannabis collection offline, on any device.

> **Live:** https://robonator9000.github.io/Stash-Tracker/

---

## ✨ Features

| | |
|---|---|
| **Inventory** | Strains with name, brand, type (Indica/Sativa/Hybrid or custom), THC/CBD, rating, price, notes, photos. Sort/filter by name, rating, THC, amount, price, favorites, stock status. |
| **Consumption** | Quick-add buttons (+0.1g to +2g) or manual input. Backdate consumption time. Track remaining amounts and last-consumed dates. |
| **Low Stock Alerts** | Set a gram threshold — a toast appears when a product drops below it. |
| **Session Mode** | Timed sessions with hit timer, bowl calculator, session notes, and rotation tracking per person. |
| **Stats Dashboard** | Totals for products, amount, sessions, avg rating, THC, value, last-consumed. Toggle visibility per stat. |
| **Favorites** | Star products, filter by favorites, always sorted first. |
| **Data Backup** | Export/import JSON. Merge imports, export CSV, copy to clipboard. |
| **PIN Lock** | 4-6 digit PIN to secure your data. |
| **Multi-Language** | English, Español, Français, Deutsch, Português. |
| **Themes** | Dark and light modes. |
| **Customization** | Currency ($/€/£/¥/₿), decimal precision (0-3), stat visibility, session defaults, low stock threshold. |
| **PWA** | Install on phone or desktop. Works offline. |

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## 🏗️ Build

```bash
npm run build          # production build to dist/
npm run build:pages    # GitHub Pages build
```

Auto-deploys from `main` via `.github/workflows/deploy-pages.yml`.

## 🧪 Testing

```bash
pip install playwright
playwright install chromium
python scripts/with_server.py \
  --server "cd /path/to/Stash-Tracker && npm run dev" --port 5173 \
  -- python /path/to/Stash-Tracker/scripts/test_app.py
```

64 assertions covering: welcome modal, language selection, products CRUD, consume/sell, low stock alerts, settings, filters, search, favorites, theme toggle, empty state.

## 🧑‍💻 Tech Stack

React 19, TypeScript, Vite, Tailwind CSS, localStorage, Lucide React, Playwright.

All data stays on your device.

---

<p align="center">Made with 💚 for the community</p>
