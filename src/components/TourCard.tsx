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
    <TiltCard className="rounded-[32px]" maxTilt={4} glareOpacity={0.05}>
      <div 
        className="group bg-white rounded-[32px] overflow-hidden border border-border-light hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer flex flex-col h-full"
        onClick={() => onNavigate('tour-detail', tour)}
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            src={tour.image}
          />
          
          {/* Wishlist Button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleWishlist(tour); }}
            className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-lg ${isFavorite ? 'bg-primary text-white scale-110' : 'bg-white/80 text-gray-500 hover:text-primary hover:scale-110'}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
          
          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <span className="bg-secondary text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
              {tour.category === 'Historical' ? (isKa ? 'ისტორიული' : 'HISTORICAL') : tour.category.toUpperCase()}
            </span>
            <span className="bg-primary text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
              {isKa ? 'ბესტსელერი' : 'BEST SELLER'}
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
             <button className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full text-xs font-black text-text-main flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">visibility</span>
                {isKa ? 'სწრაფი ნახვა' : 'Quick View'}
             </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Location & Tags */}
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{tour.location.toUpperCase()}</span>
          </div>

          {/* Title */}
          <h3 className="font-black text-xl text-text-main leading-tight mb-4 line-clamp-2">
            {tour.title}
          </h3>

          {/* Core Info */}
          <div className="flex items-center gap-4 text-text-muted text-xs font-bold mb-6">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              {tour.duration}
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px]">hiking</span>
              {isKa ? 'საშუალო' : 'Moderate'}
            </div>
            {(tour.languages || []).length > 0 && (
              <div className="flex items-center gap-1.5 ml-auto truncate" title={tour.languages?.join(', ')}>
                <span className="material-symbols-outlined text-[18px]">language</span>
                <span className="truncate max-w-[60px]">{tour.languages?.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Bottom Row: Rating & Price */}
          <div className="mt-auto pt-6 border-t border-border-light flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px] filled">star</span>
              <span className="text-sm font-black text-text-main">{tour.rating}</span>
              <span className="text-[10px] font-bold text-text-muted">({tour.reviews})</span>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-text-muted uppercase mb-1">{t.from_price}</span>
                <span className="text-2xl font-black text-primary flex items-baseline gap-0.5">
                  <span className="text-lg">{getCurrencySymbol(targetCurrency)}</span>
                  {convertPrice(tour.price, targetCurrency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

