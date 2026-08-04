import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

const theme = createTheme({
  primaryColor: 'cyan',
  colors: {
    emerald: [
      '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
      '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
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
    console.info('Stash Tracker is ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <MantineProvider theme={theme} defaultColorScheme="dark">
            <Routes>
              <Route path="/menu" element={<Suspense fallback={LoadingFallback}><MenuPage /></Suspense>} />
              <Route path="/profile/:userId" element={<Suspense fallback={LoadingFallback}><ProfilePage /></Suspense>} />
              <Route path="/redirect-profile" element={<div />} />
              <Route path="*" element={<App />} />
            </Routes>
          </MantineProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
