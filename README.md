<div align="center">

# 🌿 Stash Tracker

**Track your cannabis collection, consumption sessions, and stash — with or without an account.**

[![GitHub Pages](https://img.shields.io/badge/deployed-GitHub%20Pages-222?logo=github&logoColor=fff)](https://robonator9000.github.io/Stash-Tracker/)
[![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=fff)](https://robonator9000.github.io/Stash-Tracker/)
[![License](https://img.shields.io/badge/license-MIT-3b82f6)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=fff)](https://supabase.com)

**[Live Site](https://robonator9000.github.io/Stash-Tracker/)**

</div>

---

## ✦ Features

### 📦 Inventory Management
Track strains with name, brand, type (**Indica** · **Sativa** · **Hybrid** · custom), THC/CBD %, rating, price, notes, photos, and purchase dates. Sort, filter, and search across your entire collection.

### 🔥 Consumption Tracking
Quick-add buttons (+0.1g to +2g), manual input, and backdate support. Real-time remaining amount calculation. Every consumption logged to your activity history.

### <img src="https://api.iconify.design/lucide/cloud.svg?color=%233ecf8e" width="16" height="16" alt=""> Cloud Sync (Optional)
Sign in with email to sync across devices via Supabase. All data backed up to the cloud. Works offline with localStorage as a local cache — synced automatically when reconnected.

| Feature | Without Account | With Account |
|---|---|---|
| All core features | ✅ | ✅ |
| Local storage | ✅ | ✅ |
| Cloud backup | — | ✅ |
| Cross-device sync | — | ✅ |
| Profile & avatar | — | ✅ |
| Data export | — | ✅ |

### 🖼️ Profile & Avatars
Set a display name and upload an avatar (stored in Supabase Storage). Shown in the header alongside your sync status indicator.

### 🔐 Authentication
Email/password sign in and sign up via Supabase Auth. Includes:
- **Password reset** — forgot password flow sends a reset link
- **Account deletion** — permanently removes all data with a two-step confirmation

### 📸 Strain Color Picker
Click any strain type badge to open a color picker — choose from 10 preset swatches or reset to default. Colors apply instantly to the badge, left-edge highlight, and card glow.

### ⏱️ Session Mode
Timed consumption sessions with:
- Hit timer and bowl calculator
- Per-person rotation tracking
- Session notes with auto-save
- Shared bowl / hits-per-person breakdowns

### 📊 Stats Dashboard
At-a-glance totals for products, amount, sessions, average rating, THC, value, and last-consumed. Toggle visibility per stat.

### ♥️ Favorites
Star products to flag them. Filter by favorites. Favorites always sort to the top.

### ⚡ Low Stock Alerts
Set a gram threshold per product. A toast notification fires when stock drops below it.

### 💾 Data Portability
- **JSON export/import** — full backup with merge support
- **CSV export** — spreadsheet-friendly
- **Copy to clipboard** — quick share
- **Manual sync button** — force push/pull from cloud

### 🔒 PIN Lock
4–6 digit PIN screen on app start to secure your data locally.

### 🌐 Multi-Language
English · Español · Français · Deutsch · Português. Auto-detects browser language.

### 🎨 Themes
Dark and light modes. Auto-switch follows your system preference. Smooth backdrop blur and gradient accents throughout.

### 📱 PWA
Install on your phone or desktop. Works fully offline with a service worker. Manifest configured for standalone display.

---

## ✦ Tech Stack

| Layer | Stack |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 6 + SWC |
| **Styling** | Tailwind CSS 4 |
| **Auth & DB** | Supabase (Auth, Postgres, Storage) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **PWA** | vite-plugin-pwa + Workbox |
| **Testing** | Playwright (Python) |

---

## ✦ Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173
```

### Build for production

```bash
npm run build           # dist/
npm run build:pages     # GitHub Pages build (sets base path)
```

Auto-deploys from `main` via `.github/workflows/deploy-pages.yml`.

### Testing

```bash
pip install playwright
playwright install chromium
python scripts/with_server.py \
  --server "cd /path/to/Stash-Tracker && npm run dev" --port 5173 \
  -- python /path/to/Stash-Tracker/scripts/test_app.py
```

64+ assertions covering welcome modal, language selection, products CRUD,
consume/sell, low stock alerts, settings, filters, search, favorites, theme toggle.

---

<div align="center">Made with 💚 for the community</div>
