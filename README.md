<div align="center">

# 🌿 Stash Tracker

**Keep track of your cannabis collection, log what you use, and know what you've got — with or without an account.**

[![Live Site](https://img.shields.io/badge/try%20it%20live-GitHub%20Pages-222?logo=github&logoColor=fff)](https://robonator9000.github.io/Stash-Tracker/)
[![PWA](https://img.shields.io/badge/works%20offline-ready-5A0FC8?logo=pwa&logoColor=fff)](https://robonator9000.github.io/Stash-Tracker/)
[![License](https://img.shields.io/badge/license-MIT-3b82f6)](LICENSE)

**[🌐 Try It](https://robonator9000.github.io/Stash-Tracker/)**

</div>

---

## ✦ Features

### 📦 Inventory
Add your strains with name, brand, type (**Indica** · **Sativa** · **Hybrid** · custom), THC/CBD %, rating, price, notes, photos, and purchase dates. Sort, filter, and search through your whole collection.

### 🔥 Consumption Logging
Tap +0.1g, +0.5g, +1g, or +2g to log what you used — or type in your own amount. Backdate it if you forgot to log last night. Your stash amounts update automatically, and every use is saved to your history.

### ☁️ Cloud Sync (Optional)
No account? No problem — everything saves to your browser. Sign in with email and your data syncs across devices via Supabase. Works offline too — it'll sync back up when you reconnect.

| | Without Account | With Account |
|---|---|---|
| All features | ✅ | ✅ |
| Saved in browser | ✅ | ✅ |
| Cloud backup | — | ✅ |
| Sync across devices | — | ✅ |
| Account settings | — | ✅ |
| Data export | — | ✅ |

### 🖼️ Profile & Avatars
Set a display name and upload a profile picture. Shows up in the header next to your sync status.

### 🔐 Your Account
Sign in and sign up with email. You can:
- **Reset your password** — forgot it? Get a reset link sent to your email
- **Delete your account** — permanently removes everything, with a two-step confirmation so nothing happens by accident

### 📸 Color-Coded Strains
Click any strain badge to open a color picker. Pick from 10 swatches or reset to default. Colors show up on the badge, the edge highlight, and the card glow.

### ⏱️ Session Mode
Timed sessions with:
- Hit timer and bowl calculator
- Per-person rotation tracker
- Session notes that save automatically
- Shared bowl / hits-per-person breakdowns

### 📊 Dashboard
See your totals at a glance — products, grams, sessions, average rating, THC, value, and what you last used. Charts show your strain breakdown and consumption over time. Toggle which stats you want to see.

### ♥️ Favorites
Star your favorite strains. Filter by favorites. They always sort to the top.

### ⚡ Low Stock Alerts
Set a gram threshold and get a heads-up when something's running low.

### 💾 Export & Import
- **JSON** — full backup, with merge support
- **CSV** — open in any spreadsheet app
- **Copy to clipboard** — quick share
- **Manual sync button** — push or pull from the cloud whenever you want

### 🔒 PIN Lock
Set a 4–6 digit PIN to lock the app on startup. Your data stays private on your device.

### 🌐 Multi-Language
English · Español · Français · Deutsch · Português. Picks up your browser language automatically.

### 🎨 Themes
Dark and light modes. Auto-switch follows your system preference. Smooth blur and gradient accents throughout.

### 📱 Install on Your Phone
Open the site, add it to your home screen — it works like an app. Fully offline once installed. Works on phones, tablets, and desktops.

---

## ✦ Tech Stuff (for the curious)

Built with React, TypeScript, Vite, Tailwind CSS, Supabase, Recharts, and Lucide Icons. Full source in the `main` branch.

---

## ✦ Quick Start (for developers)

```bash
npm install
npm run dev        # → http://localhost:5173
```

### Build for production

```bash
npm run build           # outputs to dist/
npm run build:pages     # GitHub Pages build
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

64+ tests covering onboarding, language selection, products, consume/sell, low stock alerts, settings, filters, search, favorites, and theme switching.

---

<div align="center">Made with 💚 for the community</div>
