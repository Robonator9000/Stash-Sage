# 🌿 Stash Tracker

A modern progressive web app for managing your cannabis collection, tracking consumption, and logging sessions — all offline-ready on any device.

> **Try it live:** https://robonator9000.github.io/Stash-Tracker/

---

## ✨ Features

| | |
|---|---|
| **Inventory Management** | Add strains with name/brand, type (Indica/Sativa/Hybrid or custom), THC/CBD, rating, price, notes, and photos. Sort/filter by name, rating, THC, amount, price, favorites, stock status, or product type. |
| **Consumption Tracking** | Log each use with additive quick-add buttons (+0.1g, +0.25g, +0.5g, +1g, +2g) or free input. Backdate consumption time. Track remaining amounts and view last-consumed dates per product. |
| **Low Stock Alerts** | Set a gram threshold in Settings — when a product drops below it, a toast notification pops up in the bottom-right corner. |
| **Session Mode** | Start a timed session with a built-in hit timer (customizable interval), bowl calculator, grams-per-bowl input, session notes, and auto-finish animation. |
| **Blunt Rotation** | Track hits per person with an automatic rotating indicator — perfect for group sessions. Enable/disable in session defaults. |
| **Stats Dashboard** | At-a-glance totals for products, amount, sessions, average rating, THC, total value (with currency symbol), and last-consumed time. All stats can be toggled on/off. |
| **Favorites** | Star your go-to products and filter by favorites. Favorites are always sorted first. |
| **Data Backup** | Export/import your full collection and settings as JSON. Merge imports to combine collections. Export as CSV and copy to clipboard also supported. |
| **PIN Lock** | Secure your stash data with a 4–6 digit PIN. |
| **Multi-Language** | English, Español, Français, Deutsch, Português. |
| **Dark & Light Themes** | Switch between dark and light modes. |
| **Customization** | Choose currency symbol ($/€/£/¥/₿), set decimal precision (0–3), pick which stats to display, configure session defaults (amount, people, hit timer, grams per bowl, rotation), and set low stock threshold. |
| **PWA Ready** | Install on your phone or desktop. Works offline with full service-worker caching. |

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — no setup required.

## 🏗️ Build for Production

```bash
npm run build
```

Output goes to `dist/`.

### GitHub Pages Deployment

```bash
npm run build:pages
npm run preview:pages   # preview locally before pushing
```

The live site auto-deploys from the `main` branch via GitHub Actions (`.github/workflows/deploy-pages.yml`).

## 📱 Install as PWA

- **Android / Chrome:** open the app, tap **Install** or **Add to Home screen**
- **iOS / Safari:** tap **Share**, then **Add to Home Screen**
- **Desktop Chrome / Edge:** click the install icon in the address bar

The service worker caches assets for offline use, so your stash is always accessible.

## 🧪 Testing

E2E tests use **Playwright** (Python). Tests cover the full user flow: welcome modal, language selection, add/edit/delete products, consume/sell, low stock alerts, settings, filters, search, favorites, theme toggle, and empty state.

### Prerequisites

```bash
pip install playwright
playwright install chromium
```

### Run Tests

```bash
# From the skills/webapp-testing directory:
python scripts/with_server.py \
  --server "cd /path/to/Stash-Tracker && npm run dev" --port 5173 \
  -- python /path/to/Stash-Tracker/scripts/test_app.py
```

All 64 assertions must pass before pushing.

## 🧑‍💻 Dev Notes

Stash Tracker is built with:
- **React 19** + **TypeScript**
- **Vite** (fast dev server & builds)
- **Tailwind CSS** (utility-first styling)
- **localStorage** for persistence (no backend needed)
- **Lucide React** for icons
- **Playwright** (Python) for E2E testing

All your data stays on your device. Import/export is available in Settings for backups or transferring between devices.

---

<p align="center">Made with 💚 for the community</p>
