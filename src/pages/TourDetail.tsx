import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../translations';
import { Tour, fetchTours, createBooking, User, Review, fetchReviews, createReview, incrementTourViews } from '../api';
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
  
  useEffect(() => { setTargetCurrency(isKa ? 'GEL' : 'USD'); }, [isKa]);
  const [similarTours, setSimilarTours] = useState<Tour[]>([]);
  const [viewCount, setViewCount] = useState<number>(tour.views || 0);
  const [showReservation, setShowReservation] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; duration?: number } | null>(null);
  const { toggleWishlist, isInWishlist } = useWishlist(!!user);
  const isSaved = isInWishlist(tour.id);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '', guest_name: '', guest_lastname: '' });
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
    
    setViewCount(tour.views || 0);
    const viewKey = `viewed_${tour.id}`;
    if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, '1');
        incrementTourViews(tour.id).then(res => {
            if (res.success) {
                setViewCount(res.views);
            }
        });
    }
  }, [tour]);

  const mainImage = tour.image;
  const sideImages = tour.gallery && tour.gallery.length > 0 
    ? tour.gallery.slice(0, 4) 
    : [];

  return (
    <div className="min-h-screen bg-background-light pt-24 pb-28 lg:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[11px] font-bold text-text-muted mb-6 tracking-wide uppercase">
          <button onClick={() => onNavigate('home')} className="hover:text-primary transition-colors cursor-pointer">{t.breadcrumb_home}</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <button onClick={() => onNavigate('tours')} className="hover:text-primary transition-colors cursor-pointer">{tour.location}</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-text-main truncate max-w-[200px]">{tour.title}</span>
        </nav>

        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-main leading-tight font-display">{tour.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-text-muted">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-primary">location_on</span>{tour.location}</span>
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-primary">schedule</span>{tour.duration} {isKa ? 'დღე' : 'Days'}</span>
              <span className="flex items-center gap-1.5" title={isKa ? 'ნახვა' : 'Views'}><span className="material-symbols-outlined text-[18px] text-primary">visibility</span>{viewCount}</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-border-light font-semibold text-[13px] shadow-sm hover:border-gray-300 hover:text-text-main active:scale-95 transition-all text-text-muted"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              {t.tour_share}
            </button>
            <button 
              onClick={toggleSave}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-[13px] shadow-sm active:scale-95 transition-all ${
                isSaved 
                  ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' 
                  : 'bg-white border-border-light text-text-muted hover:border-gray-300 hover:text-text-main'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isSaved ? 'filled' : ''}`}>favorite</span>
              {isSaved ? (isKa ? 'შენახულია' : 'Saved') : t.tour_save}
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-12">
          <div className="rounded-2xl overflow-hidden mb-3">
            <img src={mainImage} className="w-full aspect-[21/9] object-cover hover:scale-105 transition-transform duration-700" alt={tour.title} />
          </div>
          {sideImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sideImages.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} className="w-full aspect-[4/3] object-cover hover:scale-110 transition-transform duration-500" loading="lazy" alt="" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Two-column layout: Main + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-12">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-text-main font-display">{t.tour_about}</h2>
              <p className="text-[15px] text-text-main/80 leading-relaxed font-normal whitespace-pre-line">
                {tour.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                {[
                  { label: isKa ? 'ჯგუფი' : 'Max Group', value: `${tour.maxGroupSize || 10} ${isKa ? 'კაცი' : 'people'}`, icon: 'groups' },
                  { label: isKa ? 'ენა' : 'Language', value: tour.languages?.join(', ') || (isKa ? 'ინგლისური' : 'English'), icon: 'translate' },
                  { label: isKa ? 'სირთულე' : 'Difficulty', value: tour.difficulty ? (tour.difficulty === 'easy' ? (isKa ? 'მსუბუქი' : 'Easy') : tour.difficulty === 'hard' ? (isKa ? 'რთული' : 'Hard') : (isKa ? 'საშუალო' : 'Moderate')) : (isKa ? 'საშუალო' : 'Moderate'), icon: 'hiking' },
                  ...(tour.full_price ? [{ label: isKa ? 'სრული ფასი' : 'Full Price', value: `${getCurrencySymbol(targetCurrency)}${convertPrice(tour.full_price, targetCurrency)}`, icon: 'payments' }] : []),
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-border-light space-y-2 hover:border-gray-200 hover:shadow-sm transition-all">
                    <span className="material-symbols-outlined text-primary text-[20px]">{item.icon}</span>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{item.label}</p>
                    <p className="font-semibold text-text-main text-[13px]">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Operator Info (Mobile/Small Screen) */}
              {(tour.company_name || tour.operator_name) && (
                <div 
                  onClick={() => onNavigate('operator', { operator_id: tour.operator_id || tour.operator, operator_name: tour.company_name || tour.operator_name })}
                  className="lg:hidden bg-white p-4 rounded-2xl border border-border-light flex items-center gap-4 mt-6 cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-white flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">account_circle</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.tour_provided_by}</p>
                    <p className="font-bold text-text-main truncate text-sm">{tour.company_name || tour.operator_name}</p>
                  </div>
                </div>
              )}
            </section>
            
            {/* Itinerary */}
            {(tour.itinerary && tour.itinerary.length > 0) && (
              <section className="space-y-6 pt-8 border-t border-border-light">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-text-main font-display">{isKa ? 'მარშრუტი და განრიგი' : 'Route & Itinerary'}</h2>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {tour.itinerary.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-5 rounded-2xl border border-border-light bg-white hover:border-gray-300 transition-all duration-300"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-[13px] bg-primary/5 text-primary border border-primary/10">
                            {item.day}
                          </div>
                          <div className="space-y-2 min-w-0 flex-1">
                            <h4 className="font-bold text-text-main text-[15px]">{item.title}</h4>
                            <p className="text-[13px] text-text-main/70 leading-relaxed">
                              {item.description}
                            </p>
                            {item.location && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider pt-1">
                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                {item.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Reviews Section */}
            <section className="space-y-6 pt-8 border-t border-border-light">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-text-main font-display">{t.reviews_title}</h2>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-xl border border-yellow-100">
                        <span className="material-icons text-amber-400 text-[18px]">star</span>
                        <span className="font-bold text-yellow-700 text-[13px]">{tour.reviews_count && tour.reviews_count > 0 ? (tour.rating || 0).toFixed(1) : '0.0'}</span>
                    </div>
                </div>

                {/* Write Review */}
                <div className="bg-white p-6 rounded-2xl border border-border-light space-y-5 shadow-sm">
                    <h3 className="font-bold text-[15px] text-text-main flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">chat_bubble</span>
                        {t.reviews_write}
                    </h3>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                        {!user && (
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    required
                                    type="text"
                                    placeholder={isKa ? "სახელი *" : "First Name *"}
                                    value={newReview.guest_name}
                                    onChange={(e) => setNewReview(prev => ({ ...prev, guest_name: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border-light focus:bg-white focus:border-primary outline-none font-medium text-text-main text-[13px] transition-colors"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={isKa ? "გვარი *" : "Last Name *"}
                                    value={newReview.guest_lastname}
                                    onChange={(e) => setNewReview(prev => ({ ...prev, guest_lastname: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border-light focus:bg-white focus:border-primary outline-none font-medium text-text-main text-[13px] transition-colors"
                                />
                            </div>
                        )}
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(null)}
                                    className="transition-transform active:scale-90"
                                >
                                    <span className={`material-icons text-2xl transition-colors ${
                                        star <= (hoveredStar ?? newReview.rating) ? 'text-amber-400' : 'text-gray-200'
                                    }`}>
                                        {star <= (hoveredStar ?? newReview.rating) ? 'star' : 'star_border'}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <textarea
                            required
                            value={newReview.comment}
                            onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border-light focus:bg-white focus:border-primary outline-none min-h-[100px] font-medium text-text-main text-[13px] transition-colors resize-y"
                            placeholder={isKa ? "თქვენი კომენტარი..." : "Your comment..."}
                        />
                        <button
                            type="submit"
                            disabled={isSubmittingReview || newReview.rating === 0 || !newReview.comment || (!user && (!newReview.guest_name || !newReview.guest_lastname))}
                            className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-[13px] shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmittingReview ? t.reviews_submitting : t.reviews_submit}
                        </button>
                    </form>
                </div>

                {/* Review List */}
                <div className="space-y-4">
                    {reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white p-5 rounded-2xl border border-border-light space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-text-muted font-bold text-[13px]">
                                            {review.profiles?.avatar_url ? (
                                                <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                            ) : (review.profiles?.name || 'Guest').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-text-main text-[13px]">{review.profiles?.name || 'Guest'}</p>
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={`material-icons text-[12px] ${i < review.rating ? 'text-amber-400' : 'text-gray-200'}`}>
                                                        {i < review.rating ? 'star' : 'star_border'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-medium text-text-muted">
                                            {new Date(review.created_at).toLocaleDateString(isKa ? 'ka-GE' : 'en-US')}
                                        </span>
                                        {user && (user.role === 'admin' || (user.id === tour.operator_id || user.id === tour.operator)) && (
                                            <button 
                                                onClick={() => handleDeleteReview(review.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                title={isKa ? 'წაშლა' : 'Delete'}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-text-main/80 text-[13px] leading-relaxed">"{review.comment}"</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-border-light border-dashed">
                            <p className="text-text-muted text-[13px]">{t.reviews_empty}</p>
                        </div>
                    )}
                </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 space-y-6 hidden lg:block">
            {/* Booking Card */}
            <div className="bg-white p-6 xl:p-8 rounded-2xl shadow-lg shadow-black/5 border border-border-light sticky top-[100px]">
              <div className="mb-6">
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-1.5">{isKa ? 'ფასი' : 'Price From'}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-text-main font-display">{getCurrencySymbol(targetCurrency)}{convertPrice(tour.price, targetCurrency)}</span>
                  <span className="text-text-muted font-medium text-[13px]">/ {isKa ? 'კაცზე' : 'person'}</span>
                </div>
                <div className="flex items-center gap-1 mt-4 bg-gray-50 p-1 rounded-xl w-fit border border-gray-100">
                  {(['USD', 'EUR', 'GEL'] as const).map(c => (
                     <button 
                       key={c} 
                       onClick={() => setTargetCurrency(c)} 
                       className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${targetCurrency === c ? 'bg-white shadow-sm text-primary border border-border-light' : 'text-text-muted hover:text-text-main'}`}
                     >
                       {c}
                     </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setShowReservation(true)}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold text-[15px] shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">event_available</span>
                  {isKa ? 'ტურის დაჯავშნა' : 'Reserve This Tour'}
                </button>
                
                  <div className="flex gap-2.5">
                    <a 
                      href={`tel:${tour.phone}`}
                      className="flex-1 py-3.5 bg-white border border-border-light text-text-main rounded-xl font-semibold text-[13px] hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">call</span>
                      {tour.phone ? (isKa ? 'დარეკვა' : 'Call') : (isKa ? 'ნომერი არ არის' : 'No Number')}
                    </a>
                    
                    <a 
                      href={`https://wa.me/${(tour.phone || '').replace(/\+/g, '')}?text=${encodeURIComponent(isKa ? `გამარჯობა, მაინტერესებს ტური: ${tour.title}` : `Hi, I'm interested in the tour: ${tour.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3.5 bg-[#25D366] text-white rounded-xl font-semibold text-[13px] hover:bg-[#20b858] transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      {isKa ? 'ვოთსაპი' : 'WHATSAPP'}
                    </a>
                  </div>
                  
                  <p className="text-center text-[10px] text-text-muted uppercase tracking-wider pt-2 opacity-70">{isKa ? 'ოპერატორი დაგიკავშირდებათ • უფასო გაუქმება' : 'Operator will contact you • Free cancellation'}</p>
              </div>
            </div>

            {/* Operator Info */}
            {(tour.company_name || tour.operator_name) && (
              <div 
                onClick={() => onNavigate('operator', { operator_id: tour.operator_id || tour.operator, operator_name: tour.company_name || tour.operator_name })}
                className="bg-white p-5 rounded-2xl border border-border-light flex items-center gap-4 cursor-pointer hover:border-gray-300 transition-colors group shadow-sm"
              >
                 <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:border-primary border border-transparent transition-colors">
                    {tour.operator_avatar ? (
                      <img src={tour.operator_avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="material-symbols-outlined text-[24px] text-gray-400">account_circle</span>
                    )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t.tour_provided_by}</p>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-bold text-text-main truncate text-[14px] group-hover:text-primary transition-colors">{tour.company_name || tour.operator_name}</p>
                      {tour.is_verified && (
                        <span className="material-symbols-outlined text-blue-600 text-[18px] filled" title={isKa ? "ვერიფიცირებული ოპერატორი" : "Verified Operator"}>verified</span>
                      )}
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Tours */}
        {similarTours.length > 0 && (
          <section className="mt-20 border-t border-border-light pt-12">
             <div className="flex items-end justify-between mb-8">
                <h2 className="text-2xl font-bold text-text-main font-display">{t.tour_similar_title}</h2>
                <button className="text-primary font-semibold flex items-center gap-1 group text-[13px] hover:text-primary-hover transition-colors">
                   {t.view_all} <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {similarTours.map(st => (
                  <div key={st.id} className="cursor-pointer group" onClick={() => onNavigate('tour-detail', st)}>
                     <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-border-light group-hover:shadow-md transition-all">
                        <img src={st.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                        <div className="absolute bottom-4 left-4 right-4">
                           <div className="flex items-center gap-1 mb-1.5">
                              <span className="material-icons text-amber-400 text-[14px]">star</span>
                              <span className="text-[11px] font-bold text-white">{st.rating}</span>
                           </div>
                           <h4 className="text-[15px] font-bold text-white line-clamp-1 font-display">{st.title}</h4>
                           <p className="text-white/80 text-[13px] font-medium">{getCurrencySymbol(targetCurrency)}{convertPrice(st.price, targetCurrency)}</p>
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
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{isKa ? 'ფასი' : 'From'}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-text-main font-display">{getCurrencySymbol(targetCurrency)}{convertPrice(tour.price, targetCurrency)}</span>
              <span className="text-[11px] text-text-muted font-medium">/ {isKa ? 'კაცზე' : 'person'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${tour.phone}`}
              className="w-11 h-11 bg-white border border-border-light text-primary rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
              title={isKa ? 'დარეკვა' : 'Call'}
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </a>
            <button
              onClick={() => setShowReservation(true)}
              className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-[13px] shadow-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
            >
              {isKa ? 'დაჯავშნა' : 'Reserve'} <span className="material-symbols-outlined text-[16px]">event_available</span>
            </button>
          </div>
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
