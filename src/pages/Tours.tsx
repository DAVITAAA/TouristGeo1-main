import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '../translations';
import { fetchTours, Tour } from '../api';
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

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);

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

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tour.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDest = selectedDestinations.length === 0 || selectedDestinations.some(d => tour.location.includes(d));
    // Simple duration mapping for demo
    const matchesDuration = !selectedDuration || (
      selectedDuration === '1-3 Days' ? parseInt(tour.duration) <= 3 :
      selectedDuration === '4-7 Days' ? (parseInt(tour.duration) > 3 && parseInt(tour.duration) <= 7) :
      selectedDuration === '8-14 Days' ? (parseInt(tour.duration) > 7 && parseInt(tour.duration) <= 14) :
      parseInt(tour.duration) > 14
    );
    // Be robust with price filtering, allow any string/number conversion
    const tourPrice = typeof tour.price === 'string' ? parseInt(tour.price) : tour.price;
    const matchesPrice = isNaN(tourPrice) ? true : (tourPrice >= priceRange[0] && tourPrice <= priceRange[1]);

    return matchesSearch && matchesDest && matchesDuration && matchesPrice;
  });

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

  return (
    <div className="min-h-screen bg-background-light pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-bold text-text-muted mb-8">
          <button onClick={() => onNavigate('home')} className="hover:text-primary transition-colors">{t.breadcrumb_home}</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-text-main">{isKa ? 'საქართველო' : 'Georgia'}</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-text-main">{isKa ? 'ტურების ძიება' : 'Tour Search Results'}</span>
        </nav>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-3 space-y-8">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-border-light sticky top-28">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-text-main">{t.filters}</h2>
                <button 
                  onClick={() => {
                    setSelectedDestinations([]);
                    setSelectedDuration('');
                    setPriceRange([0, 5000]);
                  }}
                  className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {t.clear_all}
                </button>
              </div>

              {/* Destination Filter */}
              <div className="space-y-4 mb-10">
                <h3 className="text-sm font-black text-text-main flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">map</span>
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
                          className="peer appearance-none w-5 h-5 rounded-md border-2 border-border-light checked:bg-primary checked:border-primary transition-all"
                        />
                        <span className="material-symbols-outlined absolute inset-0 text-white text-base font-black opacity-0 peer-checked:opacity-100 flex items-center justify-center">check</span>
                      </div>
                      <span className="text-sm font-bold text-text-muted group-hover:text-text-main transition-colors">{getTranslatedDest(dest)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-6 mb-10">
                <h3 className="text-sm font-black text-text-main flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">payments</span>
                  {t.filter_price_range}
                </h3>
                <div className="px-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="50"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-primary h-1 bg-border-light rounded-full appearance-none"
                  />
                  <div className="flex justify-between mt-4 text-xs font-black text-text-muted">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Duration Filter */}
              <div className="space-y-4 mb-10">
                <h3 className="text-sm font-black text-text-main flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                  {t.duration_label}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.durations.map(dur => (
                    <button
                      key={dur}
                      onClick={() => setSelectedDuration(selectedDuration === dur ? '' : dur)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        selectedDuration === dur 
                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                        : 'bg-background-light border-transparent text-text-muted hover:border-border-light'
                      }`}
                    >
                      {getTranslatedDuration(dur)}
                    </button>
                  ))}
                </div>
              </div>

              <button className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                {isKa ? 'ფილტრის გამოყენება' : 'Apply Filters'}
              </button>
            </div>
          </aside>

          {/* Main Results Area */}
          <main className="lg:col-span-9">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-black text-text-main">
                  {t.search_results_title}
                </h1>
                <p className="text-text-muted font-bold text-sm">
                  {filteredTours.length} {t.tours_found}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <p className="text-xs font-black text-text-muted uppercase tracking-widest">{t.sort_by}:</p>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border-light text-sm font-bold text-text-main shadow-sm">
                    {t.recommended}
                    <span className="material-symbols-outlined text-lg">expand_more</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Tags */}
            <div className="flex flex-wrap gap-2 mb-10">
              {selectedDestinations.map(d => (
                <button 
                  key={d}
                  onClick={() => toggleDest(d)}
                  className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-black flex items-center gap-2 group hover:bg-primary/20 transition-all"
                >
                  {getTranslatedDest(d)}
                  <span className="material-symbols-outlined text-sm group-hover:scale-110">close</span>
                </button>
              ))}
              {selectedDestinations.length > 0 && (
                <button 
                  onClick={() => setSelectedDestinations([])}
                  className="text-xs font-black text-text-muted uppercase tracking-widest hover:text-red-500 transition-colors ml-2"
                >
                  {t.clear_all}
                </button>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-text-muted font-black">{isKa ? 'იტვირთება...' : 'Searching Tours...'}</p>
              </div>
            ) : filteredTours.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                <AnimatePresence mode="popLayout">
                  {filteredTours.map((tour, idx) => (
                    <motion.div
                      key={tour.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <TourCard tour={tour} onNavigate={onNavigate} language={language} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Floating Map Button temporarily hidden
                <button className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-secondary text-white px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-3 z-50 hover:scale-105 transition-all">
                  <span className="material-symbols-outlined">map</span>
                  {t.show_map}
                </button>
                */}
              </div>
            ) : (
              <div className="bg-white rounded-[32px] p-20 text-center border border-dashed border-border-light">
                <span className="material-symbols-outlined text-[64px] text-gray-200 mb-6">explore_off</span>
                <h3 className="text-2xl font-black text-text-main mb-2">{t.no_matches_found}</h3>
                <p className="text-text-muted font-medium">{t.try_adjusting_filters}</p>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredTours.length > 0 && (
              <div className="mt-20 flex items-center justify-center gap-2">
                <button className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-all">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {[1, 2, 3].map(p => (
                  <button key={p} className={`w-10 h-10 rounded-xl font-black transition-all ${p === 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-border-light text-text-muted hover:border-primary hover:text-primary'}`}>
                    {p}
                  </button>
                ))}
                <span className="px-2 text-text-muted font-black">...</span>
                <button className="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-all">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
