# Stash Tracker — Site-Wide Feature Plan

This document is the roadmap for the **Stash Tracker** overhaul. It captures the
post-feed performance work, the community display-name ↔ username consistency bug,
marketplace display improvements, the admin panel revamp, and a backlog of smaller
optimizations and missing features.

> Scope note: Everything below is **planned**, not yet implemented. Items reference
> real code locations so work can start immediately.

---

## 0. Status Snapshot (as of this plan)

- Repo: `main` @ `Robonator9000/Stash-Tracker`
- Live: `https://st-sh.vercel.app` — React 18 + Vite 6 + Supabase PWA
- Recently landed: `upsertProfile()` helper in `AuthContext.tsx` with a
  column-missing fallback; `profiles.username` column added with a unique constraint
  and a looped `DO $$` dedup migration (`supabase/migrations/20260707_profile_extras.sql`).
- Removed: `social_post.png`, `social_post.py`, `social_post_today.png`, `social_post_today.py`
  (legacy screenshot/generator scripts, no longer referenced).
- README overhauled to reflect the offline-first / optional-account model.

---

## 1. Community: display-name ↔ username consistency bug

**Root cause.** The app has two identity fields: `username` (stable, unique, set once
at signup) and `display_name` (free-form, editable). Several code paths treat
`display_name` as if it were the stable handle, so changing `display_name` silently
breaks links, mentions, and resolved authors.

**Evidence in code**
- `SettingsSheet.tsx:63` — `profileUsername` is created with `useState(...)` but **no
  setter is destructured**, so it is frozen at first render. Username is presented as
  permanent (`SettingsSheet.tsx:355,408` "cannot be changed later").
- `SocialFeed.tsx:95-96` — author `username` falls back to
  `display_name.toLowerCase().replace(/\s+/g,'_')` when `username` is null. Because this
  is synthesized from `display_name`, any later `display_name` edit changes the
  synthesized handle, breaking quote-post author resolution and `@mention` links.
- `SocialFeed.tsx:252-253` — `@mentions` are matched against `profiles.display_name`,
  not `username`. Editing your `display_name` orphans every historical `@mention` to you.
- `CommunityPage.tsx:30-35` — profile resolution queries `username` first, then falls
  back to `display_name`. Links use `username` (`CommunityPage.tsx:101-106`), so a
  `display_name`-only user is reachable two different ways depending on state.

**Planned fixes**
1. **Stop synthesizing usernames from display_name.** Add a backfill migration that
   writes a real `username` for every profile where it is null (derive once, then freeze),
   and make `enrichPosts` always read the stored `username` (`SocialFeed.tsx:95`).
2. **Mentions by username, not display_name.** Parse `@username` and match
   `profiles.username` (`SocialFeed.tsx:252-253`). Keep `display_name` only for display.
3. **Make `profileUsername` reactive.** Use a real state value (or read from the saved
   profile) so the settings sheet and save path (`SettingsSheet.tsx:604-616`) never drift
   from the resolved profile.
4. **Unify profile resolution.** Have `CommunityPage.tsx` resolve only by `username`;
   remove the `display_name` fallback so there is a single canonical route. Provide a
   301-style redirect if a legacy `display_name` URL is hit.
5. **Add a regression test** covering: change `display_name` → old `@mention` still
   resolves, profile URL still works, quote author still shows correct handle.

**Acceptance:** changing `display_name` has zero effect on `@mentions`, profile URLs,
or post authorship handles.

---

## 2. Post feed optimization

**Current behavior** (`SocialFeed.tsx`)
- `enrichPosts` (`SocialFeed.tsx:37-99`) already batches profile/like/follow/comment/
  bookmark lookups with `.in(...)` + `Promise.all` — good. But quote-post enrichment
  (`SocialFeed.tsx:71-82`) triggers a *second* profiles fetch round per page.
- Trending (`SocialFeed.tsx:204`) re-queries `post_hashtags` over a 7-day window on every
  switch, with no client cache.
- Realtime channel re-enriches single posts but re-runs the full `enrichPosts` path.

**Planned optimizations**
1. **Cache profile lookups.** Memoize `user_id → {username, display_name, avatar_url}`
   in a module-level `Map` (or React context) so quote-post and realtime enrichment
   reuse already-fetched profiles instead of re-querying.
2. **Single enrichment pass.** Fold quote-author enrichment into the same `Promise.all`
   batch used by the main posts so each page does one profiles round-trip, not two.
3. **Cache trending window.** Memoize the 7-day `post_hashtags` result for the session
   (or a short TTL) and reuse when toggling back to the Trending tab.
4. **Cursor pagination safety.** Confirm `PAGE_SIZE=10` plus `range()` is stable on
   insert-heavy feeds (realtime can duplicate the top item); dedupe by `post.id` after
   merge.
5. **Optional SQL view.** Consider a `post_with_author` view (or RPC) returning posts
   joined to a minimal profile row to cut client-side enrichment entirely.

**Acceptance:** feed page does ≤1 profiles query per fetch (down from 2), trending
re-toggle costs 0 queries within a session, no duplicate top post on realtime insert.

---

## 3. Marketplace display improvements

**Current behavior** (`MarketplaceFeed.tsx`)
- Category filter + sort (newest / price-low / price-high); `enrichListings` callback
  maps author `display_name` into a `username` field (per codebase review) — same
  display-name-as-handle smell as the feed.
- Listing cards lack seller **location**, seller **rating/trust**, and clear
  availability/status badges. Linked-product info is present but easy to miss.

**Planned improvements**
1. **Author correctness.** Reuse the same profile cache as the feed; surface the real
   `username` and `display_name` consistently.
2. **Richer listing card.** Add: seller location, a trust indicator (e.g. listings
   count / account age / optional rating), price prominent, status badge
   (available / sold / reserved), and a clearer linked-product chip.
3. **Category tiles.** Keep the image/emoji category tiles but add result counts per
   category and an "All" reset.
4. **Search delegate.** Search input is delegated to the header already; ensure empty
   query resets to the active category filter rather than showing nothing.
5. **Seller sub-page.** Clicking a seller opens their marketplace listings (reuse
   `CommunityPage` pattern for resolution).

**Acceptance:** marketplace cards show location + status + real handle; category counts
visible; clicking a seller lists their items.

---

## 4. Admin panel revamp

**Current state** (`AdminDashboard.tsx`, ~23k chars) — functional but dense; needs a
clearer information hierarchy and the new identity model applied.

**Planned revamp**
1. **Apply username model.** Admin user tables must show `username` (canonical) with
   `display_name` secondary, and resolve/goto profiles by `username`.
2. **Sectioned layout.** Split into tabs/cards: Users, Listings, Posts/Reports,
   Moderation queue, System stats.
3. **Moderation actions.** Inline approve/remove for listings and posts; soft-delete
   with reason; reversible.
4. **Trust & safety signals.** Surface listing counts, new-account flags, and reported
   content so moderators can act without raw SQL.
5. **Audit log.** Lightweight table of admin actions (who/when/what) for accountability.

**Acceptance:** admin can moderate listings/posts and view users by username without
leaving the panel; actions are reversible and logged.

---

## 5. Other missing features & optimizations

**Performance / correctness**
- PWA: verify precache list and offline fallbacks; add offline indicator in the UI.
- Export/import: JSON merge should dedupe by stable id, not append.
- `upsertProfile()` fallback path should log once, not per call, to avoid console spam.

**Community**
- Follow suggestions / "people you may know".
- Post editing should preserve `post_hashtags` and `@mentions` consistently.
- Bookmark-to-collection or "save for later" grouping.

**Marketplace**
- Image gallery / multiple photos per listing.
- Price negotiation or "make offer" affordance.
- Category taxonomy stored in DB, not hardcoded in the component.

**Settings / account**
- Allow changing `display_name` from the profile tab (already implied) and surface the
  permanent `username` clearly with a copy button.
- Granular `statsVisibility` controls actually wired to dashboard/public profile.
- Account deletion / data export for GDPR-style compliance.

**i18n**
- Ensure all new strings use the `t(key, lang)` helper; add missing keys for the
  languages already supported (en/es/fr/de/pt).

---

## 6. Suggested execution order

1. **Username/display_name consistency** (Section 1) — unblocks mentions, links, and
   both feeds. Highest user-impact bug.
2. **Post feed optimization** (Section 2) — low-risk, high-perceived-speed win.
3. **Marketplace display** (Section 3) — reuse the profile cache built in step 1.
4. **Admin revamp** (Section 4) — depends on the username model from step 1.
5. **Backlog** (Section 5) — incremental, schedulable independently.

Each step should land behind a small PR with a typecheck (`npm run build`) and, where
possible, a Playwright regression test from `scripts/test_app.py`.
