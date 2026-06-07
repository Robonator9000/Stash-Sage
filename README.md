# 🌿 Stash Tracker

A modern progressive web app for managing your cannabis collection, tracking consumption, and logging sessions — all offline-ready on any device.

> **Try it live:** https://robonator9000.github.io/Stash-Tracker/

---

## ✨ Features

| | |
|---|---|
| **Inventory Management** | Add strains with name/brand, type (Indica/Sativa/Hybrid), THC/CBD, rating, price, notes, and photos. Sort/filter by name, rating, THC, amount, price, favorites, stock status, or product type. |
| **Consumption Tracking** | Log each use with custom amount via quick-add buttons or free input. Backdate consumption time. Track remaining amounts and view last-consumed dates per product. |
| **Session Mode** | Start a timed session with a built-in hit timer (customizable interval), bowl calculator, grams-per-bowl input, session notes, and auto-finish animation. |
| **Blunt Rotation** | Track hits per person with an automatic rotating indicator — perfect for group sessions. Enable/disable in session defaults. |
| **Stats Dashboard** | At-a-glance totals for products, amount, sessions, average rating, THC, total value (with currency symbol), and last-consumed time. All stats can be toggled on/off. |
| **Favorites** | Star your go-to products and filter by favorites. Favorites are always sorted first. |
| **Data Backup** | Export/import your full collection and settings as JSON. Merge imports to combine collections. Export as CSV and copy to clipboard also supported. |
| **Multi-Language** | English, Español, Français, Deutsch, Português. |
| **Dark & Light Themes** | Switch between dark and light modes. |
| **Customization** | Choose currency symbol ($/€/£/¥/₿), pick which stats to display, and set session defaults (amount, people, hit timer, grams per bowl, rotation). |
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

## 📱 Install as PWA

- **Android / Chrome:** open the app, tap **Install** or **Add to Home screen**
- **iOS / Safari:** tap **Share**, then **Add to Home Screen**
- **Desktop Chrome / Edge:** click the install icon in the address bar

The service worker caches assets for offline use, so your stash is always accessible.

## 🧪 Dev Notes

Stash Tracker is built with:
- **React 19** + **TypeScript**
- **Vite** (fast dev server & builds)
- **Tailwind CSS** (utility-first styling)
- **localStorage** for persistence (no backend needed)

All your data stays on your device. Import/export is available in Settings for backups or transferring between devices.

---

<p align="center">Made with 💚 for the community</p>
