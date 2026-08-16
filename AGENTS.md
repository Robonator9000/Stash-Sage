# Stash Sage

Cannabis stash tracker PWA (React 19 + TypeScript + Mantine 8 + Tailwind 4 + Vite 6 + Supabase).

## Commands
- `npm run dev` — dev server on :5173
- `npm run build` — typecheck (`tsc -b`) + production build + PWA service worker. MUST pass before committing.
- `npx tsc -b` — typecheck only

## Critical workflow notes

**Vite watcher is unreliable in this workspace** (path contains `(2)` and spaces — it can serve stale modules after edits). After any edit batch:
1. Kill the dev server (match `vite|npm run dev` in `Get-CimInstance Win32_Process`, `Stop-Process`)
2. Restart: `Start-Process cmd.exe -ArgumentList '/c','npm run dev > <log> 2>&1' -WorkingDirectory <repo> -WindowStyle Hidden`, wait ~14s
3. Verify freshness: `(Invoke-WebRequest http://localhost:5173/src/<edited file>).Content` must contain the new code

**Testing logged-in flows** (one keeper account exists; Supabase email signup has autoconfirm off but signup returns a session directly):
- Keeper test account: `test.buddy.design.1786844500@example.com` / `TestBuddy#2026` (owns the two feed test posts). All other test.buddy accounts were removed 2026-08-16 — keep it that way.
- Fresh throwaways: POST `https://kmyryafpkrcpgrpxkcil.supabase.co/auth/v1/signup` with `apikey: <VITE_SUPABASE_PUBLISHABLE_KEY>`, body `{email: 'test.buddy.<ts>@example.com', password: 'TestBuddy#2026'}`; delete afterwards via the admin API (`DELETE /auth/v1/admin/users/{id}` with the service key). Note: accounts created by API without an app sign-in get NO profile row until the app boots with their session — enumerate via admin users, not the profiles table.
- Inject into localStorage `sb-kmyryafpkrcpgrpxkcil-auth-token`: `{access_token, refresh_token, token_type:'bearer', expires_in:3600, expires_at:<now+3600>, user}` plus `weed-settings` = `{language:'en',theme:'dark',themeAuto:false,onboardingDone:true,coachMarksDone:true}`
- `.env` `SUPABASE_SECRET_KEY` (new `sb_secret_` format) WORKS against REST + auth admin APIs as of 2026-08-16 — the old "401, don't chase" note was from the pre-rotation key. The app itself never uses it; only `VITE_*` vars matter at runtime.

## Conventions
- All user-facing strings go through `t(key, lang)` in `src/utils/translations.ts` — keys must be added to ALL 5 languages (en/es/fr/de/pt)
- Toasts: `showToast({ id, title, body })` — `body` is required by the `ToastMessage` type; only `variant: 'danger'` renders red, everything else is cyan info
- Mantine components + Tailwind utility classes; lucide (`LucideX`) and tabler icons both in use
- Verify with Playwright scripts in `C:\Users\msuse\AppData\Local\Temp\opencode\` (pattern: fresh signup → localStorage inject → exercise UI, capture console errors/bad HTTP)

## Gotchas
- Migration drift was reconciled 2026-08-16: project is CLI-linked (`supabase link --project-ref kmyryafpkrcpgrpxkcil`), all files renamed to unique full-timestamp versions, and remote history repaired to match. `supabase db push` now applies cleanly — always `--dry-run` first anyway. `comment_likes` and everything older is recorded as applied.
- `posts` and `notifications` are in the `supabase_realtime` publication with `REPLICA IDENTITY FULL` (migration `20260816010000`) — realtime respects RLS.
- A BEFORE INSERT trigger (`trg_validate_notification`) silently DROPS notifications not backed by a real like/comment/follow/mention/listing row. If a test notification doesn't appear, that's the guard working — create the backing row first.
- Realtime channels + optimistic updates are the norm; keep console free of 4xx noise (previous audit eliminated 406/404 errors)
