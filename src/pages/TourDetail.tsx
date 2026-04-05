import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../translations';
import { Tour, fetchTours, createBooking, User } from '../api';
import { useCurrency } from '../hooks/useCurrency';
import Toast from '../components/Toast';

interface TourDetailProps {
  tour: Tour;
  onNavigate: (page: string, data?: any) => void;
  language: Language;
  user: User | null;
}

export default function TourDetail({ tour, onNavigate, language, user }: TourDetailProps) {
  const t = translations[language];
  const isKa = language === 'ka';
  const { convertPrice, getCurrencySymbol, currency } = useCurrency();
  const [activeTab, setActiveTab] = useState('About');
  const [similarTours, setSimilarTours] = useState<Tour[]>([]);
  const [bookingDate, setBookingDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('saved_tours') || '[]');
    setIsSaved(saved.some((t: any) => t.id === tour.id));
  }, [tour.id]);

  const toggleSave = () => {
    const saved = JSON.parse(localStorage.getItem('saved_tours') || '[]');
    if (isSaved) {
      const newSaved = saved.filter((t: any) => t.id !== tour.id);
      localStorage.setItem('saved_tours', JSON.stringify(newSaved));
      setIsSaved(false);
    } else {
      saved.push({
        id: tour.id,
        title: tour.title,
        image: tour.image,
        location: tour.location,
        price: tour.price,
        duration: tour.duration,
        rating: tour.rating
      });
      localStorage.setItem('saved_tours', JSON.stringify(saved));
      setIsSaved(true);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: tour.title,
        text: tour.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToast({ message: isKa ? 'ბმული დაკოპირდა!' : 'Link copied to clipboard!', type: 'success' });
    }
  };

  useEffect(() => {
    fetchTours(tour.category).then(tours => {
      setSimilarTours(tours.filter(t => t.id !== tour.id).slice(0, 4));
    }).catch(console.error);
    window.scrollTo(0, 0);
  }, [tour]);

  const handleBooking = async () => {
    if (!bookingDate) return;
    setIsBooking(true);
    try {
      await createBooking({
        tour_id: tour.id,
        user_name: user?.name || 'Guest User',
        user_email: user?.email || 'guest@example.com',
        booking_date: bookingDate,
        guests: guests,
        total_price: tour.price * guests
      });
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const mainImage = tour.image;
  const sideImages = tour.gallery && tour.gallery.length > 0 
    ? tour.gallery.slice(0, 4) 
    : [];

  return (
    <div className="min-h-screen bg-background-light pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-bold text-text-muted mb-6">
          <button onClick={() => onNavigate('home')} className="hover:text-primary transition-colors">{t.breadcrumb_home}</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-text-main">{tour.location}</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-text-main truncate">{tour.title}</span>
        </nav>

        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-text-main leading-tight">{tour.title}</h1>
            <div className="flex items-center gap-4 text-sm font-bold text-text-muted">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-lg text-primary">location_on</span>{tour.location}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-lg text-primary">schedule</span>{tour.duration} {isKa ? 'დღე' : 'Days'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-2xl border border-border-light font-black text-sm shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              {t.tour_share}
            </button>
            <button 
              onClick={toggleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-black text-sm shadow-sm active:scale-95 transition-all ${
                isSaved 
                  ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' 
                  : 'bg-white border-border-light text-text-main hover:bg-gray-50'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${isSaved ? 'filled' : ''}`}>favorite</span>
              {isSaved ? (isKa ? 'შენახულია' : 'Saved') : t.tour_save}
            </button>
          </div>
        </div>

        {/* Gallery - using aspect ratios, no fixed heights */}
        <div className="mb-12">
          {/* Main image */}
          <div className="rounded-2xl overflow-hidden shadow-lg mb-4">
            <img src={mainImage} className="w-full aspect-[16/7] object-cover" alt={tour.title} />
          </div>
          {/* Side images row */}
          {sideImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sideImages.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden shadow-md">
                  <img src={img} className="w-full aspect-[4/3] object-cover" alt="" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-border-light mb-10 overflow-x-auto no-scrollbar">
          {['About', 'Routes'].map(tab => {
            const label = tab === 'About' ? t.tour_about : t.tour_route;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                  activeTab === tab ? 'text-primary' : 'text-text-muted hover:text-text-main'
                }`}
              >
                {label}
                {activeTab === tab && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Two-column layout: Main + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-12">
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-text-main">{t.tour_about}</h2>
              <p className="text-base text-text-muted leading-relaxed font-medium">
                {tour.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-4">
                {[
                  { label: isKa ? 'ჯგუფი' : 'Max Group', value: `${tour.maxGroupSize || 10} ${isKa ? 'კაცი' : 'people'}`, icon: 'groups' },
                  { label: isKa ? 'ენა' : 'Language', value: isKa ? 'ქართული, ინგლისური' : 'English, Ka', icon: 'translate' },
                  { label: isKa ? 'სირთულე' : 'Difficulty', value: isKa ? 'საშუალო' : 'Moderate', icon: 'hiking' },
                  { label: isKa ? 'ასაკი' : 'Age Range', value: isKa ? '5 - 75 წელი' : '5 - 75 years', icon: 'person' },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-border-light space-y-2">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{item.label}</p>
                    <p className="font-black text-text-main text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Itinerary */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <section className="space-y-8">
                <h2 className="text-2xl font-black text-text-main">{t.tour_route}</h2>
                <div className="space-y-6">
                  {tour.itinerary.map((day, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-border-light space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                          {day.day}
                        </div>
                        <h3 className="text-lg font-black text-text-main">{day.title}</h3>
                      </div>
                      {day.description && (
                        <p className="text-text-muted font-medium text-sm leading-relaxed pl-11">{day.description}</p>
                      )}
                      {day.activities && day.activities.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-11">
                          {day.activities.map((act, j) => (
                            <span key={j} className="px-3 py-1.5 rounded-lg bg-background-light text-xs font-bold text-text-main border border-border-light flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {act}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[380px] flex-shrink-0 space-y-6">
            {/* Booking Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-light">
              <div className="mb-6">
                <p className="text-xs font-black text-text-muted uppercase tracking-[0.15em] mb-2">{isKa ? 'ფასი' : 'Price From'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-text-main">{getCurrencySymbol()}{convertPrice(tour.price)}</span>
                  <span className="text-text-muted font-bold text-sm">/ {isKa ? 'კაცზე' : 'person'}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 py-1.5 px-3 bg-secondary/10 w-fit rounded-lg border border-secondary/20">
                  {(['USD', 'EUR', 'GEL'] as const).filter(c => c !== currency).map(c => (
                     <span key={c} className="text-xs font-black text-secondary flex items-center gap-0.5">
                       {getCurrencySymbol(c)}{convertPrice(tour.price, c)}
                     </span>
                  ))}
                  <span className="text-[9px] font-bold text-text-muted ml-1 border-l border-border-light pl-2" title="Official National Bank of Georgia Rate">NBG</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{isKa ? 'აირჩიეთ თარიღი' : 'Select Date'}</label>
                  <input 
                    type="date" 
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="p-3.5 rounded-xl bg-background-light border border-border-light font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="bg-background-light p-4 rounded-xl border border-border-light space-y-3">
                   <div className="flex items-center justify-between text-sm font-bold text-text-muted">
                      <span>{getCurrencySymbol()}{convertPrice(tour.price)} × {guests}</span>
                      <span>{getCurrencySymbol()}{convertPrice(tour.price * guests)}</span>
                   </div>
                   <div className="flex items-center justify-between font-black text-base text-text-main pt-3 border-t border-gray-200">
                      <span>{isKa ? 'ჯამური ფასი' : 'Total Price'}</span>
                      <span className="text-primary text-xl">{getCurrencySymbol()}{convertPrice(tour.price * guests)}</span>
                   </div>
                </div>

                <button 
                  onClick={handleBooking}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isBooking ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <>{t.tour_check_availability} <span className="material-symbols-outlined text-lg">arrow_right_alt</span></>}
                </button>
                
                <p className="text-center text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">{isKa ? 'მყისიერი დადასტურება • უსაფრთხო გადახდა' : 'Instant Confirmation • Secure Payment'}</p>
              </div>
            </div>

            {/* Operator Info - only show if company_name exists */}
            {tour.company_name && (
              <div className="bg-white p-5 rounded-2xl border border-border-light flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-white flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl">account_circle</span>
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t.tour_provided_by}</p>
                    <p className="font-black text-text-main truncate text-sm">{tour.company_name}</p>
                 </div>
                 <button className="w-9 h-9 rounded-full border border-border-light flex items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-all flex-shrink-0">
                    <span className="material-symbols-outlined text-lg">forum</span>
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Similar Tours */}
        {similarTours.length > 0 && (
          <section className="mt-20">
             <div className="flex items-end justify-between mb-8">
                <h2 className="text-2xl font-black text-text-main">{t.tour_similar_title}</h2>
                <button className="text-primary font-black flex items-center gap-1 group text-sm">
                   {t.view_all} <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {similarTours.map(st => (
                  <div key={st.id} className="cursor-pointer" onClick={() => onNavigate('tour-detail', st)}>
                     <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md mb-3">
                        <img src={st.image} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                           <div className="flex items-center gap-1.5 mb-1">
                              <span className="material-symbols-outlined text-primary text-xs filled">star</span>
                              <span className="text-xs font-black text-white">{st.rating}</span>
                           </div>
                           <h4 className="text-base font-black text-white line-clamp-1">{st.title}</h4>
                           <p className="text-white/70 text-sm font-medium">{getCurrencySymbol()}{convertPrice(st.price)}</p>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

      </div>
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
