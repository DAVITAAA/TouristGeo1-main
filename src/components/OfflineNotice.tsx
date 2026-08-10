import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Language } from '../translations';

export default function OfflineNotice({ language }: { language: Language }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);
  const isKa = language === 'ka';

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showRestored) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-500">
      {isOffline ? (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto shadow-amber-500/10 animate-bounce-slow">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <WifiOff size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              {isKa ? 'ოფლაინ რეჟიმი აქტიურია' : 'Offline Mode Active'}
            </h4>
            <p className="text-[11px] text-slate-300">
              {isKa ? 'მთის ზონაში სიგნალის დაკარგვა! შენახული მარშრუტები ხელმისაწვდომია.' : 'No signal in mountain area! Cached itineraries remain accessible.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto shadow-emerald-500/10">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Wifi size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
              {isKa ? 'კავშირი აღდგენილია' : 'Connection Restored'}
            </h4>
            <p className="text-[11px] text-slate-300">
              {isKa ? 'თქვენ კვლავ ონლაინ ხართ TouristGeo-ზე.' : 'You are back online on TouristGeo.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
