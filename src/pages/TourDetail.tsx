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

  const galleryItems = tour.gallery && tour.gallery.length > 0 
    ? (tour.gallery.length < 5 ? [...tour.gallery, ...Array(5 - tour.gallery.length).fill(tour.image)] : tour.gallery)
    : Array(5).fill(tour.image);

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-text-main leading-tight">{tour.title}</h1>
            <div className="flex items-center gap-4 text-sm font-bold text-text-muted">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-lg text-primary">location_on</span>{tour.location}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-lg text-primary">schedule</span>{tour.duration} {isKa ? 'დღე' : 'Days'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-border-light font-black text-sm shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              {t.tour_share}
            </button>
            <button 
              onClick={toggleSave}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl border font-black text-sm shadow-sm active:scale-95 transition-all ${
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

        {/* Asymmetrical Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 h-[500px] md:h-[600px]">
          <div className="md:col-span-2 rounded-[32px] overflow-hidden shadow-xl border-4 border-white relative group">
            <img src={galleryItems[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
            <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="md:col-span-1 grid grid-rows-2 gap-4">
            <div className="rounded-[32px] overflow-hidden shadow-xl border-4 border-white">
              <img src={galleryItems[1]} className="w-full h-full object-cover hover:scale-110 transition-all duration-700" alt="" />
            </div>
            <div className="rounded-[32px] overflow-hidden shadow-xl border-4 border-white">
              <img src={galleryItems[2]} className="w-full h-full object-cover hover:scale-110 transition-all duration-700" alt="" />
            </div>
          </div>
          <div className="md:col-span-1 grid grid-rows-2 gap-4">
            <div className="rounded-[32px] overflow-hidden shadow-xl border-4 border-white">
              <img src={galleryItems[3]} className="w-full h-full object-cover hover:scale-110 transition-all duration-700" alt="" />
            </div>
            <div className="rounded-[32px] overflow-hidden shadow-xl border-4 border-white relative">
              <img src={galleryItems[4]} className={`w-full h-full object-cover ${tour.gallery && tour.gallery.length > 5 ? 'opacity-60 grayscale' : ''}`} alt="" />
              {tour.gallery && tour.gallery.length > 5 && (
                <button className="absolute inset-0 flex items-center justify-center font-black text-white text-lg">
                  +{tour.gallery.length - 4} {t.tour_photos_suffix}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-border-light mb-12 overflow-x-auto no-scrollbar">
          {['About', 'Routes', 'Photos', 'Reviews'].map(tab => {
            const label = tab === 'About' ? t.tour_about : tab === 'Routes' ? t.tour_route : tab === 'Photos' ? isKa ? 'სურათები' : 'Photos' : isKa ? 'მიმოხილვები' : 'Reviews';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? 'text-primary' : 'text-text-muted hover:text-text-main'
                }`}
              >
                {label}
                {activeTab === tab && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-16">
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-text-main">{t.tour_about}</h2>
              <p className="text-lg text-text-muted leading-relaxed font-medium">
                {tour.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
                {[
                  { label: isKa ? 'ჯგუფი' : 'Max Group', value: `${tour.maxGroupSize || 10} ${isKa ? 'კაცი' : 'people'}`, icon: 'groups' },
                  { label: isKa ? 'ენა' : 'Language', value: isKa ? 'ქართული, ინგლისური' : 'English, Ka', icon: 'translate' },
                  { label: isKa ? 'სირთულე' : 'Difficulty', value: isKa ? 'საშუალო' : 'Moderate', icon: 'hiking' },
                  { label: isKa ? 'ასაკი' : 'Age Range', value: isKa ? '5 - 75 წელი' : '5 - 75 years', icon: 'person' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{item.label}</p>
                    <p className="font-black text-text-main">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-10">
              <h2 className="text-2xl font-black text-text-main">{t.tour_route}</h2>
              <div className="relative pl-10 space-y-12 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-light before:dashed">
                {tour.itinerary?.map((day, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-10 top-1 w-6 h-6 rounded-full bg-primary border-4 border-white shadow-md z-10" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-text-main">{isKa ? 'დღე' : 'Day'} {day.day}: {day.title}</h3>
                        <span className="px-3 py-1 rounded-lg bg-background-light text-[10px] font-black uppercase text-text-muted border border-border-light">
                          {day.activities.length} {isKa ? 'აქტივობა' : 'Activities'}
                        </span>
                      </div>
                      <p className="text-text-muted font-medium leading-relaxed">{day.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {day.activities.map((act, j) => (
                          <span key={j} className="px-4 py-2 rounded-xl bg-white border border-border-light text-xs font-bold text-text-main shadow-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Map Section */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-text-main">{t.tour_location}</h2>
              <div className="h-[450px] rounded-[40px] overflow-hidden bg-slate-100 relative shadow-xl border-4 border-white">
                 <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(tour.location + ', Georgia')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title={tour.location}
                 ></iframe>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 lg:pl-4">
            <div className="sticky top-28 space-y-8">
              {/* Booking Card */}
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-border-light relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                
                <div className="mb-8">
                  <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-2">{isKa ? 'ფასი' : 'Price From'}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-text-main">{getCurrencySymbol()}{convertPrice(tour.price)}</span>
                    <span className="text-text-muted font-bold">/ {isKa ? 'კაცზე' : 'person'}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 py-1 px-3 bg-secondary/10 w-fit rounded-lg border border-secondary/20 shadow-sm">
                    {(['USD', 'EUR', 'GEL'] as any[]).filter((c: any) => c !== currency).map((c: any) => (
                       <span key={c} className="text-xs font-black text-secondary mix-blend-multiply flex items-center gap-1">
                         {getCurrencySymbol(c)}{convertPrice(tour.price, c)}
                       </span>
                    ))}
                    <span className="text-[9px] font-bold text-text-muted ml-1 border-l border-border-light pl-2" title="Official National Bank of Georgia Rate">NBG Live</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{isKa ? 'აირჩიეთ თარიღი' : 'Select Date'}</label>
                    <input 
                      type="date" 
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="p-4 rounded-2xl bg-background-light border border-border-light font-bold text-text-main outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="bg-background-light p-6 rounded-3xl border border-border-light space-y-4">
                     <div className="flex items-center justify-between text-sm font-bold text-text-muted">
                        <span>{getCurrencySymbol()}{convertPrice(tour.price)} x {guests}</span>
                        <span>{getCurrencySymbol()}{convertPrice(tour.price * guests)}</span>
                     </div>
                     <div className="flex items-center justify-between font-black text-lg text-text-main pt-4 border-t border-gray-200">
                        <span>{isKa ? 'ჯამური ფასი' : 'Total Price'}</span>
                        <span className="text-primary text-2xl">{getCurrencySymbol()}{convertPrice(tour.price * guests)}</span>
                     </div>
                  </div>

                  <button 
                    onClick={handleBooking}
                    className="w-full py-5 bg-primary text-white rounded-3xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {isBooking ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" /> : <>{t.tour_check_availability} <span className="material-symbols-outlined">arrow_right_alt</span></>}
                  </button>
                  
                  <p className="text-center text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{isKa ? 'მყისიერი დადასტურება • უსაფრთხო გადახდა' : 'Instant Confirmation • Secure Payment'}</p>
                </div>
              </div>

              {/* Operator Info */}
              <div className="bg-white p-6 rounded-[32px] border border-border-light flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-3xl">account_circle</span>
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t.tour_provided_by}</p>
                    <p className="font-black text-text-main truncate">{isKa ? 'საქართველოს ტურისტული სააგენტო' : 'Georgian Travel Agency'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="material-symbols-outlined text-xs text-primary filled">star</span>
                       <span className="text-xs font-black text-text-main">4.9</span>
                       <span className="text-[10px] font-bold text-text-muted">({isKa ? '1.2კ+ მიმოხილვა' : '1.2k+ reviews'})</span>
                    </div>
                 </div>
                 <button className="w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-text-muted hover:border-primary hover:text-primary transition-all">
                    <span className="material-symbols-outlined text-xl">forum</span>
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Tours */}
        <section className="mt-32">
           <div className="flex items-end justify-between mb-12">
              <h2 className="text-3xl font-black text-text-main">{t.tour_similar_title}</h2>
              <button className="text-primary font-black flex items-center gap-1 group">
                 {t.view_all} <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {similarTours.map(st => (
                <div key={st.id} className="group cursor-pointer" onClick={() => onNavigate('tour-detail', st)}>
                   <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-lg mb-4">
                      <img src={st.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary text-xs filled">star</span>
                            <span className="text-xs font-black text-white">{st.rating}</span>
                         </div>
                         <h4 className="text-lg font-black text-white line-clamp-1">{st.title}</h4>
                         <p className="text-white/70 text-sm font-medium">{getCurrencySymbol()}{convertPrice(st.price)}</p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Q&A Section */}
        <section className="mt-32 max-w-4xl mx-auto">
           <h2 className="text-3xl font-black text-text-main text-center mb-16">{t.tour_qa_title}</h2>
           <div className="space-y-6">
              {[
                 { q: isKa ? 'ჩართულია ტრანსპორტირება თბილისიდან?' : 'Is transportation included from Tbilisi?', a: isKa ? 'დიახ, ჩვენ უზრუნველვყოფთ ორმხრივ ტრანსპორტირებას თბილისის ნებისმიერი სასტუმროდან.' : 'Yes, we provide round-trip transportation from your hotel in Tbilisi.' },
                 { q: isKa ? 'შემიძლია ჯავშნის მოგვიანებით გაუქმება?' : 'Can I cancel my booking later?', a: isKa ? 'უფასო გაუქმება შესაძლებელია ტურის დაწყებამდე 48 საათით ადრე.' : 'Free cancellation is available up to 48 hours before the tour start time.' }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-[32px] border border-border-light space-y-4">
                   <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black flex-shrink-0">{isKa ? 'კ' : 'Q'}</div>
                      <p className="font-black text-text-main pt-1">{item.q}</p>
                   </div>
                   <div className="flex gap-4 ml-12 border-l-2 border-primary/20 pl-6 pb-2">
                      <p className="text-text-muted font-medium italic">{item.a}</p>
                   </div>
                </div>
              ))}
           </div>
           <div className="mt-12 text-center">
              <button className="px-10 py-5 bg-white text-text-main rounded-3xl font-black border border-border-light shadow-lg hover:bg-gray-50 transition-all">
                 {t.tour_ask_expert}
              </button>
           </div>
        </section>
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
