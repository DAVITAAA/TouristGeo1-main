import React from 'react';
import { Tour } from '../api';
import { useWishlist } from '../hooks/useWishlist';
import { useCurrency } from '../hooks/useCurrency';
import { translations, Language } from '../translations';
import TiltCard from './TiltCard';

interface TourCardProps {
  tour: Tour;
  onNavigate: (page: string, data?: any) => void;
  language: Language;
}

export default function TourCard({ tour, onNavigate, language }: TourCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const isKa = language === 'ka';
  const targetCurrency = isKa ? 'GEL' : 'USD';
  const isFavorite = isInWishlist(tour.id);
  const t = translations[language];

  return (
    <TiltCard className="rounded-[2rem]" maxTilt={3} glareOpacity={0.03}>
      <div 
        className="group bg-white rounded-[2rem] overflow-hidden border border-border-light hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer flex flex-col h-full"
        onClick={() => onNavigate('tour-detail', tour)}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            src={tour.image}
            loading="lazy"
          />
          
          {/* Wishlist Button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleWishlist(tour); }}
            className={`absolute top-3.5 right-3.5 z-20 w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 ${
              isFavorite
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-white/85 text-gray-400 hover:text-primary hover:bg-white shadow-sm'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
          
          {/* Top Badge — single, minimal */}
          <div className="absolute top-3.5 left-3.5 z-10">
            <span className="bg-white/90 backdrop-blur-md text-text-main px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm">
              {tour.category === 'Historical' ? (isKa ? 'ისტორიული' : 'Historical') : tour.category}
            </span>
          </div>

          {/* Hover overlay — subtle */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
             <span className="bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full text-[12px] font-bold text-text-main flex items-center gap-1.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                {isKa ? 'სწრაფი ნახვა' : 'Quick View'}
             </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-5 flex flex-col">
          {/* Location */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[14px]">location_on</span>
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">{(tour.location || '').toUpperCase()}</span>
            </div>
            {tour.is_verified && (
              <div className="flex items-center gap-1 text-blue-600">
                <span className="material-symbols-outlined text-[14px] filled">verified</span>
                <span className="text-[9px] font-bold uppercase tracking-tight">{isKa ? 'ვერიფიცირებული' : 'Verified'}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg text-text-main leading-snug mb-3.5 line-clamp-2 font-display">
            {tour.title}
          </h3>

          {/* Core Info */}
          <div className="flex items-center gap-3.5 text-text-muted text-xs font-medium mb-5">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {tour.duration}
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="material-symbols-outlined text-[16px]">hiking</span>
              {tour.difficulty ? (
                tour.difficulty === 'easy' ? (isKa ? 'მსუბუქი' : 'Easy') : 
                tour.difficulty === 'hard' ? (isKa ? 'რთული' : 'Hard') : 
                (isKa ? 'საშუალო' : 'Moderate')
              ) : (isKa ? 'საშუალო' : 'Moderate')}
            </div>
            {(tour.views !== undefined && tour.views > 0) && (
              <div className="flex items-center gap-1 whitespace-nowrap" title={isKa ? 'ნახვა' : 'Views'}>
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                {tour.views}
              </div>
            )}
            {(tour.languages && tour.languages.length > 0) && (
              <div className="flex items-center gap-1 ml-auto truncate" title={tour.languages.join(', ')}>
                <span className="material-symbols-outlined text-[16px]">language</span>
                <span className="truncate max-w-[60px]">{tour.languages.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Bottom Row: Rating & Price */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-icons text-amber-400 text-[18px]">star</span>
              <span className="text-sm font-bold text-text-main">
                {tour.reviews && tour.reviews > 0 ? (tour.rating || 0).toFixed(1) : '0.0'}
              </span>
              <span className="text-[10px] font-medium text-text-muted">({tour.reviews || 0})</span>
            </div>
            
            <div className="flex items-center gap-2">
               <a 
                 href={`tel:${tour.phone || ''}`}
                 onClick={(e) => e.stopPropagation()}
                 className="w-11 h-11 rounded-lg bg-gray-50 text-text-muted hover:text-primary hover:bg-primary/5 transition-all duration-300 flex items-center justify-center"
                 title={isKa ? 'დარეკვა' : 'Call'}
               >
                 <span className="material-symbols-outlined text-[18px]">call</span>
               </a>
               <a 
                 href={`https://wa.me/${(tour.phone || '').replace(/\+/g, '')}?text=${encodeURIComponent(isKa ? `გამარჯობა, მაინტერესებს ტური: ${tour.title}` : `Hi, I'm interested in the tour: ${tour.title}`)}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={(e) => e.stopPropagation()}
                 className="w-11 h-11 rounded-lg bg-[#25D366]/8 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300 flex items-center justify-center"
                 title="WhatsApp"
               >
                 <span className="material-symbols-outlined text-[18px]">chat</span>
               </a>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-medium text-text-muted uppercase mb-0.5">{t.from_price}</span>
              <span className="text-xl font-bold text-text-main flex items-baseline gap-0.5 font-display">
                <span className="text-sm text-text-muted">{getCurrencySymbol(targetCurrency)}</span>
                {convertPrice(tour.price, targetCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
