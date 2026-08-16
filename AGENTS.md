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

**Testing logged-in flows** (no seed accounts exist; Supabase email signup has autoconfirm off but signup returns a session directly):
- POST `https://kmyryafpkrcpgrpxkcil.supabase.co/auth/v1/signup` with `apikey: <VITE_SUPABASE_PUBLISHABLE_KEY>`, body `{email: 'test.buddy.<ts>@example.com', password: 'TestBuddy#2026'}`
- Inject into localStorage `sb-kmyryafpkrcpgrpxkcil-auth-token`: `{access_token, refresh_token, token_type:'bearer', expires_in:3600, expires_at:<now+3600>, user}` plus `weed-settings` = `{language:'en',theme:'dark',themeAuto:false,onboardingDone:true,coachMarksDone:true}`
- `.env` `SUPABASE_SECRET_KEY` is NOT used by the app and returns 401 (stale/mismatched) — only `VITE_*` vars matter. Don't chase it.

## Conventions
- All user-facing strings go through `t(key, lang)` in `src/utils/translations.ts` — keys must be added to ALL 5 languages (en/es/fr/de/pt)
- Toasts: `showToast({ id, title, body })` — `body` is required by the `ToastMessage` type; only `variant: 'danger'` renders red, everything else is cyan info
- Mantine components + Tailwind utility classes; lucide (`LucideX`) and tabler icons both in use
- Verify with Playwright scripts in `C:\Users\msuse\AppData\Local\Temp\opencode\` (pattern: fresh signup → localStorage inject → exercise UI, capture console errors/bad HTTP)

## Gotchas
- Supabase migrations and live DB have drifted — only apply what the app queries. `comment_likes` was applied by hand 2026-08-15 via SQL editor; if using `supabase db push`, dry-run first and `migration repair` hand-applied ones
- Realtime channels + optimistic updates are the norm; keep console free of 4xx noise (previous audit eliminated 406/404 errors)
