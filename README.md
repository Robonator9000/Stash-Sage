<div align="center">

# 🌿 STASH TRACKER

**Track your collection, log sessions, and connect with the community — with or without an account.**

[![Live Site](https://img.shields.io/badge/try%20it%20live-GitHub%20Pages-222?logo=github&logoColor=fff)](https://robonator9000.github.io/Stash-Tracker/)
[![PWA](https://img.shields.io/badge/works%20offline-ready-5A0FC8?logo=pwa&logoColor=fff)](https://robonator9000.github.io/Stash-Tracker/)
[![License](https://img.shields.io/badge/license-MIT-3b82f6)](LICENSE)

**[🌐 Try It](https://robonator9000.github.io/Stash-Tracker/)**

</div>

---

## ✦ Features

### 📦 Inventory
Add strains with name, brand, type, THC/CBD %, rating, price, notes, photos, and purchase dates. Sort, filter, search, and color-code your collection. Grid, list, and compact views.

### 🔥 Consumption Logging
Log 0.1g–2g quick amounts or type custom values. Backdate entries. Stash updates automatically. Full history with filters.

### 👥 Community
Share posts about your stash, like and comment on others' posts, and follow people. Real-time feed updates. Browse Latest, Following, or Trending feeds.

### 🏪 Marketplace
Browse and list products for sale. Filter by category and sort by price. Contact sellers via Discord, Telegram, Signal, WhatsApp, and more. Optional product linking from your stash.

### ☁️ Cloud Sync (Optional)
Everything works offline in your browser. Sign up with email to sync across devices via Supabase.

| | Without Account | With Account |
|---|---|---|
| Full features | ✅ | ✅ |
| Saved locally | ✅ | ✅ |
| Cloud backup | — | ✅ |
| Cross-device sync | — | ✅ |
| Community viewing | ✅ | ✅ |
| Community posting | — | ✅ |
| Marketplace browsing | ✅ | ✅ |
| Marketplace listing | — | ✅ |

### 📸 Color-Coded Strains
Tap any strain badge to pick from 10 colors. Colors appear on badges, card glows, and edge highlights.

### ⏱️ Session Mode
Timed sessions with hit timer, bowl calculator, per-person rotation tracking, and auto-saving notes.

### 📊 Dashboard
Totals at a glance — products, grams, sessions, avg rating, THC, value, last used. Charts for strain breakdown and consumption trends. Toggleable stats.

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

React · TypeScript · Vite · Tailwind CSS · Supabase · Recharts · Lucide Icons

---

## ✦ Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # production build → dist/
```

Auto-deploys from `main` via GitHub Actions.

### Tests

```bash
pip install playwright
playwright install chromium
python scripts/with_server.py \
  --server "cd /path/to/Stash-Tracker && npm run dev" --port 5173 \
  -- python /path/to/Stash-Tracker/scripts/test_app.py
```

64+ tests covering onboarding, language selection, CRUD, consume/sell, low stock, settings, filters, search, favorites, and theme switching.

---

<div align="center">Made with 💚 for the community</div>