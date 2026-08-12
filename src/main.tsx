import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { MantineProvider, createTheme } from '@mantine/core';
import { MotionConfig } from 'framer-motion';
import { ContextMenuProvider } from 'mantine-contextmenu';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import 'mantine-contextmenu/styles.css';
import '@gfazioli/mantine-border-animate/styles.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { classColorSchemeManager } from './utils/mantineColorScheme';
import './index.css';

const theme = createTheme({
  primaryColor: 'cyan',
  colors: {
    emerald: [
      '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
      '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
    ],
    slate: [
      '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8',
      '#64748b', '#475569', '#334155', '#1e293b', '#0f172a',
    ],
    dark: [
      '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569',
      '#334155', '#1e293b', '#1a2332', '#111827', '#0b1120',
    ],
    brand: [
      '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899',
      '#d40e76', '#bf0f6c', '#a00e5c', '#830b4b', '#5c0834',
    ],
    aqua: [
      '#ccfbf1', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4',
      '#13eeef', '#0891b2', '#0e7490', '#155e75', '#164e63',
    ],
  },
  defaultRadius: 'md',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: { fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
});

const MenuPage = lazy(() => import('./components/MenuPage').then(m => ({ default: m.MenuPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));

const LoadingFallback = (
  <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
  </div>
);

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('Stash Sage is ready to work offline.');
  },
});

// Apply theme class BEFORE React renders so Mantine's color scheme is correct on first paint.
// Must mirror App's `isDark = settings.theme === 'dark'` (useSettings default theme is 'dark').
try {
  const raw = localStorage.getItem('weed-settings');
  let themePreference: string | null = null;
  if (raw) {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.theme === 'string') themePreference = parsed.theme;
  }
  const dark = (themePreference ?? 'dark') === 'dark';
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.setAttribute('data-mantine-color-scheme', dark ? 'dark' : 'light');
  root.style.colorScheme = dark ? 'dark' : 'light';
} catch {
  /* ignore storage/parse errors */
}

// Reload once if a lazily-loaded chunk fails (usually after a stale SW serves old hashes)
let reloading = false;
function onDynamicImportError() {
  if (reloading) return;
  reloading = true;
  window.location.reload();
}
window.addEventListener('error', (e) => {
  if (e.message?.includes('Failed to fetch dynamically imported module')) onDynamicImportError();
});
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason as { message?: string };
  if (r?.message?.includes('Failed to fetch dynamically imported module')) onDynamicImportError();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <MantineProvider theme={theme} colorSchemeManager={classColorSchemeManager} defaultColorScheme="dark">
            <MotionConfig reducedMotion="user">
            <ContextMenuProvider>
            <Routes>
              <Route path="/menu" element={<Suspense fallback={LoadingFallback}><MenuPage /></Suspense>} />
              <Route path="/profile/:userId" element={<Suspense fallback={LoadingFallback}><ProfilePage /></Suspense>} />
              <Route path="/redirect-profile" element={<div />} />
              <Route path="*" element={<App />} />
            </Routes>
            </ContextMenuProvider>
            </MotionConfig>
          </MantineProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
