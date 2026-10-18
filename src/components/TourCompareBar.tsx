import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTourCompare } from '../context/TourCompareContext';
import { Language, translations } from '../translations';

interface TourCompareBarProps {
  language: Language;
}

export default function TourCompareBar({ language }: TourCompareBarProps) {
  const { compareList, removeFromCompare, clearCompare, openCompareModal } = useTourCompare();
  const t = translations[language];
  const isKa = language === 'ka';

  if (compareList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-2xl"
      >
        <div className="bg-white/95 backdrop-blur-xl border border-border-light shadow-2xl shadow-black/15 rounded-3xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
          {/* Left: Tour thumbnails */}
          <div className="flex items-center gap-2.5 overflow-x-auto py-1">
            <div className="flex items-center gap-1.5 shrink-0 pr-1 border-r border-gray-200">
              <span className="material-symbols-outlined text-primary text-[20px]">compare_arrows</span>
              <span className="text-[12px] font-bold text-text-main hidden sm:inline">
                {t.compare_btn} ({compareList.length}/3)
              </span>
            </div>

            {compareList.map((tour) => (
              <div key={tour.id} className="relative group shrink-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-border-light shadow-sm">
                  <img
                    src={tour.image || 'https://storage.georgia.travel/images/gomi-mountain-gnta.webp'}
                    alt={tour.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFromCompare(tour.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                  title={isKa ? 'წაშლა' : 'Remove'}
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: 3 - compareList.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-[10px] font-bold shrink-0"
              >
                +
              </div>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearCompare}
              className="px-3 py-2 text-text-muted hover:text-text-main text-[11px] font-bold transition-colors hidden sm:block"
            >
              {t.clear_compare}
            </button>
            <button
              onClick={openCompareModal}
              disabled={compareList.length < 2}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-[12px] sm:text-[13px] flex items-center gap-1.5 transition-all shadow-md ${
                compareList.length >= 2
                  ? 'bg-primary text-white hover:bg-primary/95 shadow-primary/20 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>{t.compare_now}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
