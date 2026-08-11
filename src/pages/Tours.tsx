import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '../translations';
import { fetchTours, Tour } from '../api';
import { useCurrency } from '../hooks/useCurrency';
import TourCard from '../components/TourCard';

interface ToursProps {
  onNavigate: (page: string, data?: any) => void;
  language: Language;
}

const filterOptions = {
  destinations: ['Svaneti', 'Kazbegi', 'Kakheti', 'Tbilisi', 'Batumi', 'Mestia'],
  durations: ['1-3 Days', '4-7 Days', '8-14 Days', '14+ Days']
};

export default function Tours({ onNavigate, language }: ToursProps) {
  const t = translations[language];
  const isKa = language === 'ka';
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const targetCurrency = isKa ? 'GEL' : 'USD';
  const symbol = getCurrencySymbol(targetCurrency);

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'duration-asc' | 'duration-desc'>('recommended');
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTours();
        setTours(data);
      } catch (error) {
        console.error('Failed to fetch tours:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleDest = (dest: string) => {
    setSelectedDestinations(prev => 
      prev.includes(dest) ? prev.filter(d => d !== dest) : [...prev, dest]
    );
  };

  const getTranslatedDest = (dest: string) => {
    switch(dest) {
      case 'Svaneti': return isKa ? 'სვანეთი' : 'Svaneti';
      case 'Kazbegi': return isKa ? 'ყაზბეგი' : 'Kazbegi';
      case 'Kakheti': return isKa ? 'კახეთი' : 'Kakheti';
      case 'Tbilisi': return isKa ? 'თბილისი' : 'Tbilisi';
      case 'Batumi': return isKa ? 'ბათუმი' : 'Batumi';
      case 'Mestia': return isKa ? 'მესტია' : 'Mestia';
      default: return dest;
    }
  };

  const getTranslatedDuration = (dur: string) => {
    if (!isKa) return dur;
    return dur.replace('Days', 'დღე').replace('Day', 'დღე');
  };

  const sortedTours = useMemo(() => {
    const filtered = tours.filter(tour => {
      const title = tour.title || '';
      const location = tour.location || '';
      const durationStr = tour.duration || '0';

      const matchesSearch = !searchQuery || title.toLowerCase().includes(searchQuery.toLowerCase()) || location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDest = selectedDestinations.length === 0 || selectedDestinations.some(d => location.includes(d));
      const matchesDuration = !selectedDuration || (
        selectedDuration === '1-3 Days' ? parseInt(durationStr) <= 3 :
        selectedDuration === '4-7 Days' ? (parseInt(durationStr) > 3 && parseInt(durationStr) <= 7) :
        selectedDuration === '8-14 Days' ? (parseInt(durationStr) > 7 && parseInt(durationStr) <= 14) :
        parseInt(durationStr) > 14
      );
      const tourPrice = typeof tour.price === 'string' ? parseInt(tour.price) : (tour.price || 0);
      const convertedPrice = convertPrice(tourPrice, targetCurrency) || 0;
      const matchesPrice = isNaN(convertedPrice) ? true : (convertedPrice >= priceRange[0] && convertedPrice <= priceRange[1]);

      return matchesSearch && matchesDest && matchesDuration && matchesPrice;
    });

    return filtered.sort((a, b) => {
      const getPrice = (t: Tour) => typeof t.price === 'string' ? parseInt(t.price) : (t.price || 0);
      const getDuration = (t: Tour) => parseInt(t.duration || '0');
      const getRating = (t: Tour) => t.rating || 0;

      switch (sortBy) {
        case 'price-asc': return getPrice(a) - getPrice(b);
        case 'price-desc': return getPrice(b) - getPrice(a);
        case 'rating': return getRating(b) - getRating(a);
        case 'duration-asc': return getDuration(a) - getDuration(b);
        case 'duration-desc': return getDuration(b) - getDuration(a);
        default: return 0;
      }
    });
  }, [tours, searchQuery, selectedDestinations, selectedDuration, priceRange, sortBy, targetCurrency, convertPrice]);

  const getSortLabel = () => {
    switch (sortBy) {
      case 'price-asc': return isKa ? 'ფასი: ზრდადი' : 'Price: Low to High';
      case 'price-desc': return isKa ? 'ფასი: კლებადი' : 'Price: High to Low';
      case 'rating': return isKa ? 'რეიტინგი' : 'Rating: High to Low';
      case 'duration-asc': return isKa ? 'ხანგრძლივობა: მზარდი' : 'Duration: Short to Long';
      case 'duration-desc': return isKa ? 'ხანგრძლივობა: კლებადი' : 'Duration: Long to Short';
      default: return t.recommended;
    }
  };

  return (
    <div className="min-h-screen bg-background-light pt-24 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-text-muted mb-8 tracking-wide">
          <button onClick={() => onNavigate('home')} className="hover:text-primary transition-colors">{t.breadcrumb_home}</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-text-main">{isKa ? 'საქართველო' : 'Georgia'}</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-text-main font-bold">{isKa ? 'ტურების ძიება' : 'Tour Search Results'}</span>
        </nav>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 w-full py-3.5 bg-white rounded-xl border border-border-light shadow-sm font-semibold text-sm text-text-main active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
            {isKa ? 'ფილტრები' : 'Filters'}
            {(selectedDestinations.length > 0 || selectedDuration) && (
              <span className="bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {selectedDestinations.length + (selectedDuration ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Mobile Filter Overlay */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-[2100] lg:hidden">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto mobile-filter-enter shadow-2xl">
                <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-6 pt-5 pb-4 border-b border-border-light flex items-center justify-between">
                  <h2 className="text-lg font-bold text-text-main font-display">{t.filters}</h2>
                  <button onClick={() => setMobileFiltersOpen(false)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-text-muted hover:text-text-main transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="p-6 space-y-8">
                  {/* Destination Filter */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-primary text-[18px]">map</span>
                      {t.destinations}
                    </h3>
                    <div className="space-y-3">
                      {filterOptions.destinations.map(dest => (
                        <label key={dest} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input type="checkbox" checked={selectedDestinations.includes(dest)} onChange={() => toggleDest(dest)} className="peer appearance-none w-5 h-5 rounded-md border-2 border-gray-200 checked:bg-primary checked:border-primary transition-all duration-300" />
                            <span className="material-symbols-outlined absolute inset-0 text-white text-[16px] font-bold opacity-0 peer-checked:opacity-100 flex items-center justify-center">check</span>
                          </div>
                          <span className="text-[13px] font-medium text-text-muted group-hover:text-text-main transition-colors">{getTranslatedDest(dest)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Price Range */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
                      {t.filter_price_range}
                    </h3>
                    <div className="px-2">
                      <input type="range" min="0" max="50000" step="100" value={priceRange[1]} onChange={(e) => setPriceRange([0, parseInt(e.target.value)])} className="w-full accent-primary h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer" />
                      <div className="flex justify-between mt-4 text-xs font-semibold text-text-muted">
                        <span>{symbol}{priceRange[0]}</span>
                        <span>{symbol}{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>
                  {/* Duration Filter */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-text-main flex items-center gap-2 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                      {t.duration_label}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {filterOptions.durations.map(dur => (
                        <button key={dur} onClick={() => setSelectedDuration(selectedDuration === dur ? '' : dur)} className={`px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all duration-300 ${selectedDuration === dur ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-gray-50 border-transparent text-text-muted hover:border-gray-300 hover:text-text-main'}`}>
                          {getTranslatedDuration(dur)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => { setSelectedDestinations([]); setSelectedDuration(''); setPriceRange([0, 5000]); }} className="flex-1 py-3.5 bg-gray-50 text-text-main rounded-full font-bold text-[14px] hover:bg-gray-100 transition-colors">{t.clear_all}</button>
                    <button onClick={() => setMobileFiltersOpen(false)} className="flex-1 py-3.5 bg-primary text-white rounded-full font-bold text-[14px] shadow-lg shadow-primary/20 active:scale-95 transition-all">{isKa ? 'შედეგების ნახვა' : 'Show Results'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Filters — desktop only */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white p-6 xl:p-8 rounded-[2rem] shadow-sm border border-border-light sticky top-[100px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[17px] font-extrabold text-text-main font-display">{t.filters}</h2>
                <button 
                  onClick={() => {
                    setSelectedDestinations([]);
                    setSelectedDuration('');
                    setPriceRange([0, 50000]);
                  }}
                  className="text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-primary transition-colors"
                >
                  {t.clear_all}
                </button>
              </div>

              {/* Destination Filter */}
              <div className="space-y-4 mb-8">
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">map</span>
                  {t.destinations}
                </h3>
                <div className="space-y-3">
                  {filterOptions.destinations.map(dest => (
                    <label key={dest} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedDestinations.includes(dest)}
                          onChange={() => toggleDest(dest)}
                          className="peer appearance-none w-[18px] h-[18px] rounded-[4px] border-2 border-gray-200 checked:bg-primary checked:border-primary transition-all duration-300"
                        />
                        <span className="material-symbols-outlined absolute inset-0 text-white text-[14px] font-bold opacity-0 peer-checked:opacity-100 flex items-center justify-center">check</span>
                      </div>
                      <span className="text-[13px] font-medium text-text-main/70 group-hover:text-text-main transition-colors">{getTranslatedDest(dest)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-5 mb-8">
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">payments</span>
                  {t.filter_price_range}
                </h3>
                <div className="px-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="50000" 
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-primary h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-3 text-[11px] font-semibold text-text-muted">
                    <span>{symbol}{priceRange[0]}</span>
                    <span>{symbol}{priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Duration Filter */}
              <div className="space-y-4 mb-8">
                <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                  {t.duration_label}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.durations.map(dur => (
                    <button
                      key={dur}
                      onClick={() => setSelectedDuration(selectedDuration === dur ? '' : dur)}
                      className={`px-2.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                        selectedDuration === dur 
                        ? 'bg-primary/5 border-primary/40 text-primary shadow-sm' 
                        : 'bg-gray-50 border-transparent text-text-muted hover:border-gray-200 hover:text-text-main'
                      }`}
                    >
                      {getTranslatedDuration(dur)}
                    </button>
                  ))}
                </div>
              </div>

              <button className="w-full py-3.5 bg-primary text-white rounded-full font-bold text-[14px] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all">
                {isKa ? 'ფილტრის გამოყენება' : 'Apply Filters'}
              </button>
            </div>
          </aside>

          {/* Main Results Area */}
          <main className="lg:col-span-9">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
              <div className="space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-main font-display">
                  {t.search_results_title}
                </h1>
                <p className="text-text-muted text-[13px] font-medium">
                  {sortedTours.length} {t.tours_found}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest hidden sm:block">{t.sort_by}</p>
                <div className="relative">
                  <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-border-light text-[13px] font-semibold text-text-main shadow-sm hover:border-gray-300 hover:bg-gray-50 transition-all min-w-[180px] justify-between"
                  >
                    {getSortLabel()}
                    <span className={`material-symbols-outlined text-[18px] text-text-muted transition-transform ${isSortOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {isSortOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                      <div className="absolute right-0 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-border-light py-1.5 z-20 animate-fade-in origin-top">
                        {[
                          { id: 'recommended', label: t.recommended },
                          { id: 'price-asc', label: isKa ? 'ფასი: ზრდადი' : 'Price: Low to High' },
                          { id: 'price-desc', label: isKa ? 'ფასი: კლებადი' : 'Price: High to Low' },
                          { id: 'rating', label: isKa ? 'რეიტინგი' : 'Rating: High to Low' },
                          { id: 'duration-asc', label: isKa ? 'ხანგრძლივობა: მზარდი' : 'Duration: Short to Long' },
                          { id: 'duration-desc', label: isKa ? 'ხანგრძლივობა: კლებადი' : 'Duration: Long to Short' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSortBy(opt.id as any);
                              setIsSortOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-gray-50 ${
                              sortBy === opt.id ? 'text-primary font-semibold' : 'text-text-main font-medium'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Active Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {selectedDestinations.map(d => (
                <button 
                  key={d}
                  onClick={() => toggleDest(d)}
                  className="px-3 py-1.5 bg-primary/5 text-primary border border-primary/20 rounded-lg text-[11px] font-bold flex items-center gap-1.5 group hover:bg-primary/10 transition-colors"
                >
                  {getTranslatedDest(d)}
                  <span className="material-symbols-outlined text-[14px] group-hover:scale-110">close</span>
                </button>
              ))}
              {selectedDestinations.length > 0 && (
                <button 
                  onClick={() => setSelectedDestinations([])}
                  className="text-[11px] font-bold text-text-muted hover:text-text-main transition-colors ml-1 px-2"
                >
                  {t.clear_all}
                </button>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-text-muted text-sm font-medium">{isKa ? 'იტვირთება...' : 'Searching Tours...'}</p>
              </div>
            ) : sortedTours.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <AnimatePresence mode="popLayout">
                  {sortedTours.map((tour, idx) => (
                    <motion.div
                      key={tour.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                    >
                      <TourCard tour={tour} onNavigate={onNavigate} language={language} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-border-light">
                <span className="material-symbols-outlined text-[48px] text-gray-300 mb-4">explore_off</span>
                <h3 className="text-xl font-bold text-text-main mb-2 font-display">{t.no_matches_found}</h3>
                <p className="text-text-muted text-[13px]">{t.try_adjusting_filters}</p>
              </div>
            )}

            {/* Pagination Controls */}
            {sortedTours.length > 0 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button className="w-11 h-11 rounded-full bg-white border border-border-light flex items-center justify-center text-text-muted hover:border-gray-300 hover:text-text-main transition-all">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                {[1, 2, 3].map(p => (
                  <button key={p} className={`w-11 h-11 rounded-full text-[14px] font-bold transition-all ${p === 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-border-light text-text-main hover:border-gray-300 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
                <span className="px-2 text-text-muted font-bold text-base">...</span>
                <button className="w-11 h-11 rounded-full bg-white border border-border-light flex items-center justify-center text-text-muted hover:border-gray-300 hover:text-text-main transition-all">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
