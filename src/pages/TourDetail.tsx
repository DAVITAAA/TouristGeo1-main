import ItineraryMap from '../components/ItineraryMap';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../translations';
import { Tour, fetchTours, createBooking, User, Review, fetchReviews, createReview } from '../api';
import { useCurrency } from '../hooks/useCurrency';
import { useWishlist } from '../hooks/useWishlist';
import ReservationModal from '../components/ReservationModal';
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
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const [targetCurrency, setTargetCurrency] = useState<'USD' | 'EUR' | 'GEL'>(isKa ? 'GEL' : 'USD');
  const [showPhone, setShowPhone] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<number | undefined>(undefined);
  useEffect(() => { setTargetCurrency(isKa ? 'GEL' : 'USD'); }, [isKa]);
  const [similarTours, setSimilarTours] = useState<Tour[]>([]);
  const [guests, setGuests] = useState(1);
  const [showReservation, setShowReservation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; duration?: number } | null>(null);
  const { toggleWishlist, isInWishlist } = useWishlist(!!user);
  const isSaved = isInWishlist(tour.id);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', guest_name: '', guest_lastname: '' });
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews(tour.id).then(setReviews).catch(console.error);
  }, [tour.id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && (!newReview.guest_name || !newReview.guest_lastname)) {
      setToast({ message: isKa ? 'გთხოვთ შეიყვანოთ სახელი და გვარი' : 'Please enter your first and last name', type: 'error' });
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      const guestNameStr = !user ? `${newReview.guest_name} ${newReview.guest_lastname}` : undefined;
      const result = await createReview({
        tour_id: tour.id,
        rating: newReview.rating,
        comment: newReview.comment,
        guest_name: guestNameStr
      });
      const reviewName = user ? user.name : guestNameStr;
      const reviewAvatar = user ? user.avatar_url : undefined;
      
      setReviews(prev => [{ ...result, profiles: { name: reviewName || '', avatar_url: reviewAvatar } }, ...prev]);
      setNewReview({ rating: 5, comment: '', guest_name: '', guest_lastname: '' });
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
      setToast({ message: isKa ? 'შეფასება დამატებულია!' : 'Review added!', type: 'success' });
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || 'Error', type: 'error' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await import('../api').then(m => m.deleteReview(reviewId));
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setToast({ message: isKa ? 'შეფასება წაიშალა' : 'Review deleted', type: 'success' });
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || 'Error deleting review', type: 'error' });
    }
  };

  const toggleSave = () => {
    const adding = !isSaved;
    toggleWishlist(tour);
    
    if (adding) {
      if (!user) {
        setToast({ 
          message: isKa 
            ? 'ტური შენახულია. გაიარეთ ავტორიზაცია, რათა არ წაიშალოს 7 დღეში.' 
            : 'Tour saved! Log in or register so it won\'t be removed after 7 days.', 
          type: 'info',
          duration: 6000
        });
      }
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



  const mainImage = tour.image;
  const sideImages = tour.gallery && tour.gallery.length > 0 
    ? tour.gallery.slice(0, 4) 
    : [];

  return (
    <div className="min-h-screen bg-background-light pt-24 pb-28 lg:pb-20">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-bold text-text-muted mb-6">
          <button onClick={() => onNavigate('home')} className="hover:text-primary transition-colors cursor-pointer">{t.breadcrumb_home}</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <button onClick={() => onNavigate('tours')} className="hover:text-primary transition-colors cursor-pointer">{tour.location}</button>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-text-main truncate">{tour.title}</span>
        </nav>

        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-text-main leading-tight">{tour.title}</h1>
            <div className="flex items-center gap-4 text-sm font-bold text-text-muted">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-lg text-primary">location_on</span>{tour.location}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-lg text-primary">schedule</span>{tour.duration} {isKa ? 'დღე' : 'Days'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-2xl border border-border-light font-black text-sm shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-text-main"
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



        {/* Two-column layout: Main + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-12">
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-text-main">{t.tour_about}</h2>
              <p className="text-base text-text-muted leading-relaxed font-medium">
                {tour.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 pt-4">
                {[
                  { label: isKa ? 'ჯგუფი' : 'Max Group', value: `${tour.maxGroupSize || 10} ${isKa ? 'კაცი' : 'people'}`, icon: 'groups' },
                  { label: isKa ? 'ენა' : 'Language', value: tour.languages?.join(', ') || (isKa ? 'ინგლისური' : 'English'), icon: 'translate' },
                  { label: isKa ? 'სირთულე' : 'Difficulty', value: tour.difficulty ? (tour.difficulty === 'easy' ? (isKa ? 'მსუბუქი' : 'Easy') : tour.difficulty === 'hard' ? (isKa ? 'რთული' : 'Hard') : (isKa ? 'საშუალო' : 'Moderate')) : (isKa ? 'საშუალო' : 'Moderate'), icon: 'hiking' },
                  ...(tour.full_price ? [{ label: isKa ? 'სრული ფასი' : 'Full Price', value: `${getCurrencySymbol(targetCurrency)}${convertPrice(tour.full_price, targetCurrency)}`, icon: 'payments' }] : []),
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-border-light space-y-2">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{item.label}</p>
                    <p className="font-black text-text-main text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Operator Info (Mobile/Small Screen) */}
              {(tour.company_name || tour.operator_name) && (
                <div 
                  onClick={() => onNavigate('operator', { operator_id: tour.operator_id || tour.operator, operator_name: tour.company_name || tour.operator_name })}
                  className="lg:hidden bg-white p-5 rounded-2xl border border-border-light flex items-center gap-4 mt-6 cursor-pointer hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-white flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl">account_circle</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t.tour_provided_by}</p>
                    <p className="font-black text-text-main truncate text-sm">{tour.company_name || tour.operator_name}</p>
                  </div>
                </div>
              )}
            </section>



            
            {/* Itinerary & Map Section */}
            {(tour.itinerary && tour.itinerary.length > 0) && (
              <section className="space-y-8 pt-8 border-t border-border-light">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-text-main">{isKa ? 'მარშრუტი და განრიგი' : 'Route & Itinerary'}</h2>
                  <p className="text-sm text-text-muted font-medium">{isKa ? 'გააჩერეთ კურსორი დღეზე, რომ ნახოთ რუკაზე' : 'Hover over a day to see it on the map'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 min-h-[500px]">
                  {/* Itinerary List */}
                  <div className="md:col-span-5 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {tour.itinerary.map((item, idx) => (
                      <div 
                        key={idx}
                        onMouseEnter={() => setHoveredDay(item.day)}
                        onMouseLeave={() => setHoveredDay(undefined)}
                        className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${
                          hoveredDay === item.day 
                            ? 'bg-primary/5 border-primary shadow-md translate-x-2' 
                            : 'bg-white border-border-light hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-black text-sm transition-colors ${
                            hoveredDay === item.day ? 'bg-primary text-white' : 'bg-background-light text-text-muted'
                          }`}>
                            {item.day}
                          </div>
                          <div className="space-y-2 min-w-0">
                            <h4 className="font-black text-text-main leading-tight">{item.title}</h4>
                            <p className="text-xs text-text-muted font-medium leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                              {item.description}
                            </p>
                            {item.location && (
                              <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest pt-1">
                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                {item.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Map */}
                  <div className="md:col-span-7 h-[400px] md:h-auto sticky top-24">
                    <ItineraryMap itinerary={tour.itinerary} activeDay={hoveredDay} />
                  </div>
                </div>
              </section>
            )}

            {/* Reviews Section */}
            <section className="space-y-8 pt-8 border-t border-border-light">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-text-main">{t.reviews_title}</h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 rounded-lg border border-yellow-100">
                        <span className="material-symbols-outlined text-yellow-400 text-lg fill-1">star</span>
                        <span className="font-black text-yellow-700">{tour.rating || '5.0'}</span>
                    </div>
                </div>

                {/* Write Review */}
                <div className="bg-white p-6 rounded-2xl border border-border-light space-y-6 shadow-sm">
                    <h3 className="font-black text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">chat_bubble</span>
                        {t.reviews_write}
                    </h3>
                    <form onSubmit={handleReviewSubmit} className="space-y-5">
                        {!user && (
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    required
                                    type="text"
                                    placeholder={isKa ? "სახელი *" : "First Name *"}
                                    value={newReview.guest_name}
                                    onChange={(e) => setNewReview(prev => ({ ...prev, guest_name: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-background-light border border-border-light focus:border-primary outline-none font-medium text-text-main"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={isKa ? "გვარი *" : "Last Name *"}
                                    value={newReview.guest_lastname}
                                    onChange={(e) => setNewReview(prev => ({ ...prev, guest_lastname: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-background-light border border-border-light focus:border-primary outline-none font-medium text-text-main"
                                />
                            </div>
                        )}
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(null)}
                                    className="transition-transform active:scale-90"
                                >
                                    <span className={`material-symbols-outlined text-3xl transition-colors ${
                                        star <= (hoveredStar ?? newReview.rating) ? 'text-yellow-400 fill-1' : 'text-gray-200'
                                    }`}>star</span>
                                </button>
                            ))}
                        </div>
                        <textarea
                            required
                            value={newReview.comment}
                            onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-background-light border border-border-light focus:border-primary outline-none min-h-[100px] font-medium text-text-main"
                            placeholder={isKa ? "თქვენი კომენტარი..." : "Your comment..."}
                        />
                        <button
                            type="submit"
                            disabled={isSubmittingReview || !newReview.comment || (!user && (!newReview.guest_name || !newReview.guest_lastname))}
                            className="w-full py-3.5 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmittingReview ? t.reviews_submitting : t.reviews_submit}
                        </button>
                    </form>
                </div>

                {/* Review List */}
                <div className="space-y-4">
                    {reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white p-6 rounded-2xl border border-border-light space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-black">
                                            {review.profiles?.avatar_url ? (
                                                <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                            ) : review.profiles?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-text-main text-sm">{review.profiles?.name}</p>
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={`material-symbols-outlined text-xs ${i < review.rating ? 'text-yellow-400 fill-1' : 'text-gray-200'}`}>star</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-text-muted">
                                            {new Date(review.created_at).toLocaleDateString(isKa ? 'ka-GE' : 'en-US')}
                                        </span>
                                        {user && (user.id === tour.operator_id || user.id === tour.operator) && (
                                            <button 
                                                onClick={() => handleDeleteReview(review.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                title={isKa ? 'წაშლა' : 'Delete'}
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-text-muted text-sm font-medium italic">"{review.comment}"</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-white rounded-2xl border border-border-light border-dashed">
                            <p className="text-text-muted font-bold">{t.reviews_empty}</p>
                        </div>
                    )}
                </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[380px] flex-shrink-0 space-y-6 hidden lg:block">
            {/* Booking Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-light">
              <div className="mb-6">
                <p className="text-xs font-black text-text-muted uppercase tracking-[0.15em] mb-2">{isKa ? 'ფასი' : 'Price From'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-text-main">{getCurrencySymbol(targetCurrency)}{convertPrice(tour.price, targetCurrency)}</span>
                  <span className="text-text-muted font-bold text-sm">/ {isKa ? 'კაცზე' : 'person'}</span>
                </div>
                <div className="flex items-center gap-1 mt-3 bg-background-light p-1 rounded-xl w-fit border border-border-light">
                  {(['USD', 'EUR', 'GEL'] as const).map(c => (
                     <button 
                       key={c} 
                       onClick={() => setTargetCurrency(c)} 
                       className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${targetCurrency === c ? 'bg-white shadow-sm text-primary border border-border-light' : 'text-text-muted hover:text-text-main'}`}
                     >
                       {c}
                     </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setShowReservation(true)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">event_available</span>
                  {isKa ? 'ტურის დაჯავშნა' : 'Reserve This Tour'}
                </button>
                
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowPhone(!showPhone)}
                      className="flex-1 py-3.5 bg-white border border-border-light text-text-main rounded-2xl font-black text-xs hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">call</span>
                      {showPhone ? (tour.phone || 'N/A') : (isKa ? 'ნომრის ნახვა' : 'Show Number')}
                    </button>
                    
                    <a 
                      href={`https://wa.me/${(tour.phone || '').replace(/\+/g, '')}?text=${encodeURIComponent(isKa ? `გამარჯობა, მაინტერესებს ტური: ${tour.title}` : `Hi, I'm interested in the tour: ${tour.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3.5 bg-[#25D366] text-white rounded-2xl font-black text-xs hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      WHATSAPP
                    </a>
                  </div>
                  
                  <p className="text-center text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">{isKa ? 'ოპერატორი დაგიკავშირდებათ • უფასო გაუქმება' : 'Operator will contact you • Free cancellation'}</p>
              </div>
            </div>

            {/* Operator Info */}
            {(tour.company_name || tour.operator_name) && (
              <div 
                onClick={() => onNavigate('operator', { operator_id: tour.operator_id || tour.operator, operator_name: tour.company_name || tour.operator_name })}
                className="bg-white p-5 rounded-2xl border border-border-light flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors group"
              >
                 <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-white flex-shrink-0 group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-2xl">account_circle</span>
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t.tour_provided_by}</p>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-black text-text-main truncate text-sm group-hover:text-primary transition-colors">{tour.company_name || tour.operator_name}</p>
                      {tour.is_verified && (
                        <span className="material-symbols-outlined text-blue-600 text-[18px] filled" title="Verified Operator">verified</span>
                      )}
                    </div>
                 </div>
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
                           <p className="text-white/70 text-sm font-medium">{getCurrencySymbol(targetCurrency)}{convertPrice(st.price, targetCurrency)}</p>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

      </div>

        {/* Mobile Sticky Booking Bar */}
        <div className="mobile-booking-bar lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">{isKa ? 'ფასი' : 'From'}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-text-main">{getCurrencySymbol(targetCurrency)}{convertPrice(tour.price, targetCurrency)}</span>
                <span className="text-xs text-text-muted font-bold">/ {isKa ? 'კაცზე' : 'person'}</span>
              </div>
            </div>
            <button
              onClick={() => setShowReservation(true)}
              className="px-6 py-3 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isKa ? 'დაჯავშნა' : 'Reserve'} <span className="material-symbols-outlined text-[16px]">event_available</span>
            </button>
          </div>
        </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          duration={toast.duration}
          onClose={() => setToast(null)} 
        />
      )}

      {showReservation && (
        <ReservationModal
          tour={tour}
          language={language}
          onClose={() => setShowReservation(false)}
        />
      )}
    </div>
  );
}
