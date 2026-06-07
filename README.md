# 🌿 Stash Tracker

A modern progressive web app for managing your cannabis collection, tracking consumption, and logging sessions — all offline-ready on any device.

> **Try it live:** https://robonator9000.github.io/Stash-Tracker/

---

## ✨ Features

| | |
|---|---|
| **Inventory Management** | Add strains with THC/CBD, type, brand, rating, notes, and photos |
| **Consumption Tracking** | Log each use, track remaining amounts, and review consumption history |
| **Session Mode** | Start a timed session with a built-in hit timer, bowl calculator, and notes |
| **Blunt Rotation** | Track hits per person with an automatic rotation — perfect for group sessions |
| **Stats Dashboard** | At-a-glance totals for products, amount, sessions, average rating, THC, and value |
| **Customizable** | Choose which stats to show, pick your theme, and set session defaults |
| **Multi-Language** | English, Español, Français, Deutsch, Português |
| **Dark & Light Themes** | Switch between dark and light modes |
| **PWA Ready** | Install on your phone or desktop. Works offline. |

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
