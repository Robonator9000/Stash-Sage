<div align="center">

# Stash Sage

**Track your stash. Log your sessions. Connect with your community.**

[![Live Site](https://img.shields.io/badge/try%20it%20live-Vercel-22c55e?logo=vercel&logoColor=fff)](https://st-sh.vercel.app)
[![Works Offline](https://img.shields.io/badge/works%20offline-ready-06b6d4?logo=pwa&logoColor=fff)](https://st-sh.vercel.app)

**[Try It Live](https://st-sh.vercel.app)**

</div>

---

## What is Stash Sage?

Stash Sage is a free app that helps you keep track of your stash — how much you have, how much you've used, and how much you've spent. Think of it like a personal inventory manager built specifically for your collection.

You can use it right in your browser. No download required. It works offline, so you can use it anywhere. And if you create an account, your data syncs across all your devices.

### Why use it?

- **Never lose track of your inventory** — know exactly how much you have at all times
- **See your habits** — beautiful charts show your usage patterns over time
- **Log sessions with friends** — track hits, rotation, and timing with built-in tools
- **Buy and sell** — browse the community marketplace or list your own products
- **Share your experience** — post reviews, follow friends, and discover new strains

---

## Features

### Your Stash
Add your strains with all the details — name, brand, type, THC/CBD levels, price, photos, and notes. Organize with colors, filters, and search. View as a grid, list, or compact layout.

### Consumption Tracking
Log what you use with quick-pick amounts or custom values. Your totals update automatically. See a full history of everything you've logged.

### Session Mode
Start a session, set a timer, and track hits per person. The app rotates through participants automatically and calculates bowls per person. Perfect for group sessions.

### Dashboard
See all your stats at a glance — total products, grams remaining, sessions logged, average rating, total value, and more. Beautiful charts break down your usage by strain type and over time.

### Community
Share posts about your stash, follow other users, like and comment on posts, and browse feeds by Latest, Following, Trending, or Bookmarked.

### Marketplace
Browse and list products for sale. Filter by category, sort by price, and contact sellers directly through your preferred platform.

### Cloud Sync (Optional)
Everything works offline in your browser. Create a free account to sync across devices, post in the community, and list items in the marketplace.

| Feature | Without Account | With Account |
|---|:---:|:---:|
| Track your stash | Yes | Yes |
| Works offline | Yes | Yes |
| Cloud backup | — | Yes |
| Sync across devices | — | Yes |
| Read community | Yes | Yes |
| Post in community | — | Yes |
| Browse marketplace | Yes | Yes |
| List in marketplace | — | Yes |

### More Goodies
- **Export your data** — JSON, CSV, or PDF backups
- **PIN lock** — keep your stash private
- **5 languages** — English, Spanish, French, German, Portuguese
- **Dark & light themes** — auto-follows your system preference
- **Installable** — add to your home screen like a native app

---

## Getting Started

### For Users

Just visit **[st-sh.vercel.app](https://st-sh.vercel.app)** — that's it. The app works in your browser immediately, no installation needed. You can optionally install it to your home screen for a native-app experience.

### For Developers

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build
```

The app runs without any backend configuration — all local features work out of the box. To enable cloud sync and community features, copy `.env.example` to `.env` and add your Supabase credentials.

---

## Tech Stack

Built with modern web technologies:

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS + Mantine UI |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) |
| Animations | Framer Motion + Magic UI |
| Charts | Recharts |
| Offline | Workbox (Progressive Web App) |

---

## Project Structure

```
src/
  components/     UI components
  contexts/       React contexts (Auth, Settings)
  types/          TypeScript definitions
  utils/          Helpers and utilities
  App.tsx         Main app entry point
```

---

## About

Stash Sage was built to solve a simple problem: keeping track of your personal collection shouldn't be complicated. Whether you're a casual user who wants to know how much you have left, or an enthusiast who wants detailed tracking with charts and session tools — Stash Sage handles it all without getting in your way.

The app is open source, privacy-focused, and works entirely offline. Your data stays on your device unless you choose to sync. No ads, no tracking, no nonsense.

Built with care for the community. Contributions welcome.

---

<div align="center">

**[Try Stash Sage](https://st-sh.vercel.app)**

Made with care for the community

</div>
