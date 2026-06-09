---
Task ID: 1
Agent: Main
Task: Implement all pending UI changes for Stash Tracker

Work Log:
- Removed box styling from active tab buttons - now only underline indicates active tab (removed `data-[state=active]:bg-muted`, `hover:outline`, added `hover:bg-muted/30`)
- Grew search bar to `max-w-3xl` with larger height (h-9), bigger search icon (size-4), and teal focus ring
- Moved Add Product, Settings, Theme toggle to right side of header (already was right-aligned, added comment for clarity)
- Enhanced history tab with: filter-by-type buttons, Badge labels per activity type, detailed change info (remaining amount, revenue, etc.), relative timestamps
- Enhanced API routes: consume now logs `remaining` and `previousAmount`; sell logs `remaining` and `previousAmount`; update logs `changes` with old/new values
- Compacted settings: all rows use `grid-cols-2` with `h-8` inputs and `text-xs` for denser layout; added Budget Limit + Budget Period row; Show Timer Ms now inline with Switch
- Theme toggle hydration fix was already in place with `useSyncExternalStore`

Stage Summary:
- Tab buttons now show only teal underline for active state (no box/background)
- Search bar is centered and grown (max-w-3xl, h-9)
- History tab has richer detail: badges, filter buttons, remaining amounts, relative timestamps
- Settings sheet is more compact with all rows doubled up
- API routes log more granular change history
- Lint passes clean, all API routes return 200
