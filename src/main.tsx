import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Auto-recovery for Vite dynamic module preload errors after deployments
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error encountered, reloading page to fetch newest assets...', event);
  window.location.reload();
});

// Register PWA Service Worker for Offline Mode in Mountain Regions
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => console.log('TouristGeo PWA Service Worker registered:', reg.scope),
      (err) => console.error('PWA SW registration failed:', err)
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
