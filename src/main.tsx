import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

const MenuPage = lazy(() => import('./components/MenuPage').then(m => ({ default: m.MenuPage })));
const CommunityPage = lazy(() => import('./components/CommunityPage').then(m => ({ default: m.CommunityPage })));
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
          <Routes>
            <Route path="/menu" element={<Suspense fallback={LoadingFallback}><MenuPage /></Suspense>} />
            <Route path="/community" element={<Suspense fallback={LoadingFallback}><CommunityPage /></Suspense>} />
            <Route path="/profile/:userId" element={<Suspense fallback={LoadingFallback}><ProfilePage /></Suspense>} />
            <Route path="*" element={<App />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
