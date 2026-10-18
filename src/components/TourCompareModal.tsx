import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tour } from '../api';
import { useTourCompare } from '../context/TourCompareContext';
import { useCurrency } from '../hooks/useCurrency';
import { Language, translations } from '../translations';

interface TourCompareModalProps {
  language: Language;
  onNavigate: (page: string, data?: any) => void;
}

export default function TourCompareModal({ language, onNavigate }: TourCompareModalProps) {
  const { compareList, isCompareModalOpen, closeCompareModal, removeFromCompare, clearCompare } = useTourCompare();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const t = translations[language];
  const isKa = language === 'ka';
  const symbol = getCurrencySymbol();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCompareModalOpen) {
        closeCompareModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompareModalOpen, closeCompareModal]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCompareModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCompareModalOpen]);

  if (!isCompareModalOpen) return null;

  const getDifficultyLabel = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return { label: isKa ? 'მარტივი' : 'Easy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'hard':
        return { label: isKa ? 'რთული' : 'Hard', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: isKa ? 'საშუალო' : 'Moderate', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  const handleSelectTour = (tour: Tour) => {
    closeCompareModal();
    onNavigate('tour-detail', tour);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCompareModal}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-white rounded-3xl shadow-2xl border border-border-light w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border-light flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">compare_arrows</span>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-text-main font-display">{t.compare_tours}</h2>
                <p className="text-[12px] font-medium text-text-muted">
                  {isKa ? `შედარებაშია ${compareList.length} ტური` : `Comparing ${compareList.length} tours side by side`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearCompare}
                className="px-3.5 py-1.5 rounded-xl text-[12px] font-bold text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                {t.clear_compare}
              </button>
              <button
                onClick={closeCompareModal}
                className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-text-main flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Comparison Content Table / Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className={`grid grid-cols-${compareList.length} gap-4 sm:gap-6 min-w-[600px]`}>
              {compareList.map((tour) => {
                const diff = getDifficultyLabel(tour.difficulty);
                const tourPrice = typeof tour.price === 'string' ? parseInt(tour.price) : (tour.price || 0);

                return (
                  <div
                    key={tour.id}
                    className="flex flex-col bg-gray-50/70 rounded-3xl p-4 sm:p-5 border border-border-light space-y-5"
                  >
                    {/* Image & Title Card */}
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-sm group">
                      <img
                        src={tour.image || 'https://storage.georgia.travel/images/gomi-mountain-gnta.webp'}
                        alt={tour.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={() => removeFromCompare(tour.id)}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-gray-600 hover:text-rose-600 hover:bg-white shadow flex items-center justify-center transition-all"
                        title={isKa ? 'წაშლა' : 'Remove'}
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                          {tour.location}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-text-main font-display line-clamp-2 leading-tight mb-2">
                        {tour.title}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons text-amber-400 text-[18px]">star</span>
                        <span className="text-sm font-bold text-text-main">
                          {tour.reviews && tour.reviews > 0 ? (tour.rating || 0).toFixed(1) : '0.0'}
                        </span>
                        <span className="text-[11px] font-medium text-text-muted">
                          ({tour.reviews || tour.reviews_count || 0})
                        </span>
                      </div>
                    </div>

                    {/* Price Row */}
                    <div className="p-3.5 bg-white rounded-2xl border border-border-light flex items-center justify-between">
                      <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{t.from_price}</span>
                      <span className="text-xl font-black text-text-main font-display">
                        <span className="text-sm text-text-muted mr-0.5">{symbol}</span>
                        {convertPrice(tourPrice)}
                      </span>
                    </div>

                    {/* Features Comparison List */}
                    <div className="space-y-3 text-[13px] bg-white p-4 rounded-2xl border border-border-light flex-1">
                      {/* Duration */}
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-text-muted flex items-center gap-1.5 text-[12px] font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                          {isKa ? 'ხანგრძლივობა' : 'Duration'}
                        </span>
                        <span className="font-bold text-text-main">{tour.duration}</span>
                      </div>

                      {/* Difficulty */}
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-text-muted flex items-center gap-1.5 text-[12px] font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">hiking</span>
                          {isKa ? 'სირთულე' : 'Difficulty'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${diff.color}`}>
                          {diff.label}
                        </span>
                      </div>

                      {/* Category */}
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-text-muted flex items-center gap-1.5 text-[12px] font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">category</span>
                          {isKa ? 'კატეგორია' : 'Category'}
                        </span>
                        <span className="font-semibold text-text-main">{tour.category}</span>
                      </div>

                      {/* Max Group Size */}
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-text-muted flex items-center gap-1.5 text-[12px] font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">groups</span>
                          {isKa ? 'ჯგუფი' : 'Group Size'}
                        </span>
                        <span className="font-semibold text-text-main">
                          {tour.maxGroupSize ? `${tour.maxGroupSize} ${isKa ? 'ადამიანი' : 'max'}` : '—'}
                        </span>
                      </div>

                      {/* Languages */}
                      <div className="flex items-center justify-between py-1 border-b border-gray-100">
                        <span className="text-text-muted flex items-center gap-1.5 text-[12px] font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">language</span>
                          {isKa ? 'ენები' : 'Languages'}
                        </span>
                        <span className="font-semibold text-text-main truncate max-w-[120px] text-right">
                          {tour.languages && tour.languages.length > 0 ? tour.languages.join(', ') : 'KA, EN'}
                        </span>
                      </div>

                      {/* Operator */}
                      <div className="flex items-center justify-between py-1">
                        <span className="text-text-muted flex items-center gap-1.5 text-[12px] font-medium">
                          <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                          {isKa ? 'ოპერატორი' : 'Operator'}
                        </span>
                        <span className="font-semibold text-text-main truncate max-w-[120px] text-right">
                          {tour.operator_name || tour.company_name || tour.operator || (isKa ? 'დადასტურებული' : 'Verified')}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleSelectTour(tour)}
                      className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-[13px] shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>{t.view_details_btn}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
