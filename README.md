<div align="center">

# 🌿 STASH SAGE

**A privacy-first stash tracker & community platform. Track your collection, log sessions, and connect — works offline, syncs when you want.**

[![Live Site](https://img.shields.io/badge/try%20it%20live-Vercel-222?logo=vercel&logoColor=fff)](https://st-sh.vercel.app)
[![PWA](https://img.shields.io/badge/works%20offline-ready-5A0FC8?logo=pwa&logoColor=fff)](https://st-sh.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-3b82f6)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=fff)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-2-3ecf8e?logo=supabase&logoColor=fff)](https://supabase.com)

**[🌐 Try It Live](https://st-sh.vercel.app)**

</div>

---

## ✦ Overview

Stash Sage is a progressive web app for tracking your stash, logging consumption, and engaging with a community marketplace — all without forcing an account. Your data lives locally by default; sign up only when you want cloud sync, social, or marketplace features.

Built as a single-page React app with offline-first storage and optional Supabase cloud sync.

---

## ✦ Features

### 📦 Inventory Management
Add strains with name, brand, type, THC/CBD %, rating, price, notes, photos, and purchase dates. Sort, filter, search, and **color-code** your collection. Switch between **grid**, **list**, and **compact** views.

### 🔥 Consumption Logging
Log 0.1g–2g quick amounts or type custom values. Backdate entries. Stash totals update automatically. Full filterable history.

### ⏱️ Session Mode
Timed sessions with hit timer, bowl calculator, per-person rotation tracking, and auto-saving notes.

### 📊 Dashboard
At-a-glance totals — products, grams, sessions, avg rating, THC %, value, last used. Charts for strain breakdown and consumption trends. Toggleable stat tiles.

### 👥 Community Feed
Share posts about your stash, like and comment, and follow other users. **Real-time** feed updates via Supabase channels. Browse **Latest**, **Following**, **Trending**, or **Bookmarked** feeds with pagination.

### 🏪 Marketplace
Browse and list products for sale. Filter by category and sort by newest / price-low / price-high. Contact sellers via Discord, Telegram, Signal, WhatsApp, and more. Optionally link a product from your stash to a listing.

### ☁️ Cloud Sync (Optional)
Everything works offline in your browser. Sign up with email to sync across devices via Supabase.

| Capability | Without Account | With Account |
|---|:---:|:---:|
| Full local features | ✅ | ✅ |
| Saved on device | ✅ | ✅ |
| Cloud backup | — | ✅ |
| Cross-device sync | — | ✅ |
| Community viewing | ✅ | ✅ |
| Community posting | — | ✅ |
| Marketplace browsing | ✅ | ✅ |
| Marketplace listing | — | ✅ |

### 📸 Color-Coded Strains
Tap any strain badge to pick from 10 colors. Colors surface on badges, card glows, and edge highlights.

### 💾 Export & Import
- **JSON** — full backup with merge support
- **CSV** — open in any spreadsheet
- **PDF** — printable product list
- **Clipboard** — quick copy
- **Manual sync** — push/pull from cloud

### 🔒 PIN Lock
4–6 digit PIN to lock the app. Private data stays on your device.

### 🌐 Multi-Language
English · Español · Français · Deutsch · Português. Auto-detects browser language.

### 🎨 Themes
Dark and light modes. Auto-switch follows system preference. Blur and gradient accents throughout.

### 📱 PWA
Install on your home screen — works offline like a native app. Phones, tablets, and desktops.

---

## ✦ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5 |
| Bundler | Vite 6 |
| Styling | Tailwind CSS 3 |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Routing | React Router 7 |
| Charts | Recharts |
| Icons | Lucide React |
| PDF | jsPDF + autotable |
| Offline | Workbox (via vite-plugin-pwa) |

---

## ✦ Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
```

### Environment

Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key:

```bash
cp .env.example .env
```

The app also runs **without** Supabase configured — all local-only features work out of the box.

---

## ✦ Project Structure

```
src/
├── components/      # UI components (inventory, community, marketplace, admin, …)
├── contexts/        # React contexts (Auth, Settings, Toast)
├── types/           # Shared TypeScript interfaces
├── utils/           # Helpers (supabase client, storage, formatting)
└── App.tsx          # Root app + routing
supabase/
└── migrations/      # SQL migrations (profiles, posts, listings, …)
scripts/             # Playwright test runner
```

---

## ✦ Tests

End-to-end tests powered by Playwright:

```bash
pip install playwright
playwright install chromium
python scripts/with_server.py \
  --server "cd /path/to/Stash-Sage && npm run dev" --port 5173 \
  -- python /path/to/Stash-Sage/scripts/test_app.py
```

64+ tests covering onboarding, language selection, CRUD, consume/sell, low stock, settings, filters, search, favorites, and theme switching.

---

## ✦ Deployment

Auto-deploys to Vercel from the `main` branch via GitHub Actions. Vercel config lives in `vercel.json`.

---

## ✦ Roadmap

See [FEATURE_PLAN.md](./FEATURE_PLAN.md) for the full roadmap of optimizations, bug fixes, and planned features, including:

- Post feed performance optimization (N+1 query elimination)
- Community display-name / username consistency fix
- Marketplace display improvements
- Admin panel revamp

---

<div align="center">Made with 💚 for the community</div>
