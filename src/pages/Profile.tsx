import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';
import { User, fetchMyBookings, updateMe, uploadAvatar, fetchMyTours, deleteTour, initiatePasswordChange, completePasswordChange, deleteAccount } from '../api';
import { useCurrency } from '../hooks/useCurrency';
import { useWishlist } from '../hooks/useWishlist';
import Toast from '../components/Toast';

interface ProfileProps {
  onNavigate: (page: string, data?: any) => void;
  language: Language;
  user: User;
  onUpdateUser: (user: Partial<User>) => void;
  onLogout: () => void;
}

export default function Profile({ onNavigate, language, user, onUpdateUser, onLogout }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings' | 'favorites' | 'my-tours' | 'security'>(
    user.role === 'operator' ? 'my-tours' : 'favorites'
  );
  const [bookings, setBookings] = useState<any[]>([]);
  const { wishlist: favorites } = useWishlist(!!user);
  const [myTours, setMyTours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    company_name: user.company_name || ''
  });

  // Security tab state: Step 1 = verify email, Step 2 = enter new password, Step 3 = done
  const [securityStep, setSecurityStep] = useState<'start' | 'verify' | 'password' | 'done'>('start');
  const [newPassword, setNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [typedEmail, setTypedEmail] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [targetEmail, setTargetEmail] = useState<string | null>(null);

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteToursChecked, setDeleteToursChecked] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [tourToDelete, setTourToDelete] = useState<number | null>(null);
  const [isDeletingTour, setIsDeletingTour] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      onLogout();
      onNavigate('home');
    } catch (err: any) {
      setToast({ 
        message: isKa ? `შეცდომა წაშლისას: ${err.message}` : `Error deleting account: ${err.message}`, 
        type: 'error' 
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };


  const isPasswordValid = {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]/'`~\\]/.test(newPassword),
  };
  const allPasswordValid = Object.values(isPasswordValid).every(Boolean);

  // Step 1: Send OTP to verify identity via email
  const handleSendVerification = async () => {
      setIsSavingPassword(true);
      setPasswordError(null);
      try {
          const result = await initiatePasswordChange('__verify_only__');
          setTargetEmail(result.email);
          setSecurityStep('verify');
      } catch (err: any) {
          setPasswordError(err.message);
      } finally {
          setIsSavingPassword(false);
      }
  };

  // Step 2: Verify OTP, then show password form
  const handleVerifyCode = async () => {
      if (verificationCode.length !== 4) return;
      setIsSavingPassword(true);
      setPasswordError(null);
      try {
          await completePasswordChange(verificationCode);
          setSecurityStep('password');
          setVerificationCode('');
      } catch (err: any) {
          setPasswordError(err.message || (isKa ? 'კოდი არასწორია' : 'Invalid code'));
      } finally {
          setIsSavingPassword(false);
      }
  };

  // Step 3: Save new password
  const handleSaveNewPassword = async () => {
      if (!allPasswordValid) return;
      setIsSavingPassword(true);
      setPasswordError(null);
      try {
          await initiatePasswordChange(newPassword);
          setPasswordSuccess(isKa ? 'პაროლი წარმატებით შეიცვალა! თქვენ გამოხვალთ სისტემიდან...' : 'Password changed successfully! Logging you out...');
          setSecurityStep('done');
          setNewPassword('');
          
          // Log out after a short delay so user can see the success message
          setTimeout(() => {
              onLogout();
              onNavigate('home');
          }, 3000);
      } catch (err: any) {
          setPasswordError(err.message);
      } finally {
          setIsSavingPassword(false);
      }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const result = await uploadAvatar(e.target.files[0]);
        onUpdateUser({ avatar_url: result.avatar_url });
        setToast({ message: isKa ? 'პროფილის სურათი განახლდა' : 'Avatar updated successfully', type: 'success' });
      } catch (error) {
        setToast({ message: isKa ? 'შეცდომა სურათის ატვირთვისას' : 'Failed to upload avatar', type: 'error' });
      }
    }
  };
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const isKa = language === 'ka';
  const targetCurrency = isKa ? 'GEL' : 'USD';

  useEffect(() => {
    fetchMyBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setIsLoading(false));

    if (user.role === 'operator') {
      fetchMyTours().then(setMyTours).catch(console.error);
    }
  }, [activeTab, user.role]);

  const promptDeleteTour = (id: number) => {
    setTourToDelete(id);
  };

  const confirmDeleteTour = async () => {
    if (tourToDelete === null) return;
    setIsDeletingTour(true);
    try {
      await deleteTour(tourToDelete);
      setMyTours(myTours.filter(t => t.id !== tourToDelete));
      setToast({ message: isKa ? 'წარმატებით წაიშალა' : 'Tour deleted successfully', type: 'success' });
    } catch (err) {
      setToast({ message: isKa ? 'შეცდომა წაშლისას' : 'Failed to delete tour', type: 'error' });
    } finally {
      setIsDeletingTour(false);
      setTourToDelete(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateMe(editForm);
      onUpdateUser(editForm);
      setToast({ message: isKa ? 'პროფილი წარმატებით განახლდა' : 'Profile updated successfully', type: 'success' });
    } catch (err) {
      setToast({ message: isKa ? 'შეცდომა განახლებისას' : 'Failed to update profile', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 flex flex-col md:flex-row items-center gap-8 border border-border-light">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-4 border-primary/20">
              {user.avatar_url ? (
                <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="material-symbols-outlined text-4xl md:text-6xl text-primary font-black">person</span>
              )}
            </div>
            <label className="absolute bottom-1 right-1 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg border border-border-light flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[18px] md:text-[20px]">photo_camera</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-text-main mb-1">{user.name}</h1>
            <p className="text-text-muted font-bold flex items-center justify-center md:justify-start gap-2">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              {user.email}
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                {user.role === 'operator' 
                  ? (isKa ? 'ტურ-ოპერატორი' : 'Tour Operator') 
                  : (isKa ? 'ტურისტი' : 'Traveler')}
              </span>
              {user.company_name && (
                <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                  {user.company_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-md mb-8 border border-border-light overflow-x-auto no-scrollbar">
          {user.role === 'operator' && (
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 min-w-fit py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'bookings' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
            >
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              {isKa ? 'ჯავშნები' : 'Bookings'}
            </button>
          )}
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 min-w-fit py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
          >
            <span className="material-symbols-outlined text-[18px]">favorite</span>
            {isKa ? 'რჩეულები' : 'Favorites'}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 min-w-fit py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            {isKa ? 'პარამეტრები' : 'Settings'}
          </button>
          <button
            onClick={() => { setActiveTab('security'); setSecurityStep('start'); setPasswordError(null); setPasswordSuccess(null); setNewPassword(''); setVerificationCode(''); setTypedEmail(''); }}
            className={`flex-1 min-w-fit py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'security' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            {isKa ? 'უსაფრთხოება' : 'Security'}
          </button>
          
          {user.role === 'operator' && (
            <button
              onClick={() => setActiveTab('my-tours')}
              className={`flex-1 min-w-fit py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'my-tours' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-main'}`}
            >
              <span className="material-symbols-outlined text-[18px]">tour</span>
              {isKa ? 'ჩემი ტურები' : 'My Tours'}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'bookings' ? (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-black text-text-main mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-primary rounded-full"></span>
                {isKa ? 'ჩემი ჯავშნები' : 'My Bookings'}
                <span className="ml-auto bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-lg">
                  {bookings.length} {isKa ? 'ჯამში' : 'total'}
                </span>
              </h2>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                  <p className="font-bold text-text-muted italic">{isKa ? 'იტვირთება...' : 'Loading bookings...'}</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <span className="material-symbols-outlined text-5xl">event_busy</span>
                  </div>
                  <h3 className="text-xl font-black text-text-main mb-2">
                    {isKa ? 'ჯავშნები არ არის' : 'No bookings found'}
                  </h3>
                  <p className="text-text-muted mb-8 max-w-sm mx-auto font-medium">
                    {isKa ? 'თქვენ ჯერ არ გაგიკეთებიათ არცერთი ჯავშანი. დაათვალიერეთ ჩვენი ტურები.' : 'You haven\'t booked any tours yet. Explore our exciting destinations!'}
                  </p>
                  <button
                    onClick={() => onNavigate('tours')}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    {isKa ? 'ტურების დათვალიერება' : 'Explore Tours'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {bookings.map((booking) => (
                    <motion.div
                      layout
                      key={booking.id}
                      className="bg-white rounded-3xl p-6 shadow-lg border border-border-light flex flex-col md:flex-row gap-6 relative group overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-2 h-full bg-primary/20"></div>
                      <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shadow-md">
                        <img src={booking.tour_image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="font-black text-xl text-text-main mb-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => onNavigate('tour-detail', { id: booking.tour_id, title: booking.tour_title, image: booking.tour_image })}>
                              {booking.tour_title}
                            </h3>
                            <p className="text-sm text-text-muted font-bold flex items-center gap-1.5 uppercase tracking-widest">
                              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                              {booking.booking_date}
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                            booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {booking.status}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-gray-50">
                          <div>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">{isKa ? 'რაოდენობა' : 'Guests'}</p>
                            <p className="font-black text-text-main flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
                              {booking.guests} {isKa ? 'პირი' : 'person'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">{isKa ? 'ფასი' : 'Total Price'}</p>
                            <p className="font-black text-primary text-lg">
                              {getCurrencySymbol(targetCurrency)}{convertPrice(booking.total_price, targetCurrency)}
                            </p>
                          </div>
                          <div className="col-span-2 flex items-center justify-end">
                            <button className="flex items-center gap-2 text-primary font-black text-sm hover:underline">
                              {isKa ? 'დეატლები' : 'View Details'}
                              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'my-tours' && user.role === 'operator' ? (
            <motion.div
              key="my-tours"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                 <h2 className="text-2xl font-black text-text-main flex items-center gap-3">
                   <span className="w-8 h-1 bg-primary rounded-full"></span>
                   {isKa ? 'ჩემი დამატებული ტურები' : 'My Uploaded Tours'}
                   <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-lg">
                     {myTours.length} {isKa ? 'ჯამში' : 'total'}
                   </span>
                 </h2>
                 <button onClick={() => onNavigate('add-tour')} className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl font-black text-sm hover:bg-primary/20 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {isKa ? 'ტურის დამატება' : 'Add Tour'}
                 </button>
              </div>

              {myTours.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <span className="material-symbols-outlined text-5xl">tour</span>
                  </div>
                  <h3 className="text-xl font-black text-text-main mb-2">
                    {isKa ? 'თქვენ არ გაქვთ დამატებული ტურები' : 'You have not uploaded any tours yet'}
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {myTours.map((tour) => (
                    <div key={tour.id} className="group flex flex-col md:flex-row gap-6 bg-white p-6 rounded-3xl border border-border-light shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
                      <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 cursor-pointer" onClick={() => onNavigate('tour-detail', tour)}>
                        <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-start gap-4">
                           <h4 onClick={() => onNavigate('tour-detail', tour)} className="font-black text-xl text-text-main mb-1 truncate cursor-pointer hover:text-primary transition-colors">{tour.title}</h4>
                           <span className={`px-3 py-1 text-[10px] shrink-0 font-black uppercase tracking-widest rounded-lg ${tour.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{tour.status}</span>
                        </div>
                        <p className="text-xs font-bold text-text-muted flex items-center gap-1 mb-4 uppercase tracking-widest mt-1">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          {tour.location}
                        </p>
                        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                           <p className="font-black text-primary flex items-center gap-1">
                              {getCurrencySymbol(targetCurrency)}{convertPrice(tour.price, targetCurrency)}
                           </p>
                           <div className="flex gap-2">
                              <button onClick={() => onNavigate('edit-tour', tour)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center">
                                 <span className="material-symbols-outlined">edit</span>
                              </button>
                              <button onClick={() => promptDeleteTour(tour.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center">
                                 <span className="material-symbols-outlined">delete</span>
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'favorites' ? (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-black text-text-main mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-primary rounded-full"></span>
                {isKa ? 'რჩეული ტურები' : 'Favorite Tours'}
                <span className="ml-auto bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-lg">
                  {favorites.length} {isKa ? 'ჯამში' : 'total'}
                </span>
              </h2>

              {favorites.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <span className="material-symbols-outlined text-5xl">favorite_border</span>
                  </div>
                  <h3 className="text-xl font-black text-text-main mb-2">
                    {isKa ? 'არ გყავთ რჩეული ტურები' : 'No favorites found'}
                  </h3>
                  <button
                    onClick={() => onNavigate('tours')}
                    className="mt-6 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    {isKa ? 'ტურების დათვალიერება' : 'Explore Tours'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favorites.map((fav) => (
                    <div key={fav.id} onClick={() => onNavigate('tour-detail', fav)} className="cursor-pointer group flex gap-4 bg-white p-4 rounded-3xl border border-border-light shadow-sm hover:shadow-lg transition-all h-36">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0">
                        <img src={fav.image} alt={fav.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="py-2 flex flex-col justify-center">
                        <h4 className="font-black text-text-main mb-1 line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors">{fav.title}</h4>
                        <p className="text-[10px] font-bold text-text-muted flex items-center gap-1 mb-2 uppercase tracking-widest mt-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {fav.location}
                        </p>
                        <p className="font-black text-primary flex items-center gap-1 mt-auto">
                           {getCurrencySymbol(targetCurrency)}{convertPrice(fav.price, targetCurrency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto md:mx-0"
            >
              <h2 className="text-2xl font-black text-text-main mb-8 flex items-center gap-3">
                <span className="w-8 h-1 bg-primary rounded-full"></span>
                {isKa ? 'პროფილის რედაქტირება' : 'Edit Profile'}
              </h2>

              <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl p-8 shadow-xl border border-border-light space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                      {isKa ? 'სახელი' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full text-text-main p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all font-bold"
                      placeholder={isKa ? 'შეიყვანეთ სახელი' : 'Enter your name'}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">business</span>
                      {isKa ? 'კომპანია (სურვილისამებრ)' : 'Company Name (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={editForm.company_name}
                      onChange={e => setEditForm({...editForm, company_name: e.target.value})}
                      className="w-full text-text-main p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all font-bold"
                      placeholder={isKa ? 'თქვენი კომპანია' : 'Your company'}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                  >
                    {isSaving ? (
                      <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        {isKa ? 'შენახვა' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="mt-8 p-6 rounded-3xl bg-red-50 border border-red-100">
                <h3 className="text-red-800 font-black mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">dangerous</span>
                  {isKa ? 'საშიში ზონა' : 'Danger Zone'}
                </h3>
                <p className="text-sm text-red-600 mb-4 font-medium">
                  {isKa ? 'ანგარიშის წაშლა სამუდამოა და ვერ აღდგება.' : 'Deleting your account is permanent and cannot be undone.'}
                </p>

                {showDeleteConfirm ? (
                  <div className="bg-white p-4 rounded-xl border border-red-200 mt-4 animate-fade-in shadow-sm">
                    <p className="text-red-700 font-bold mb-3 text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      {isKa ? 'დარწმუნებული ხართ?' : 'Are you completely sure?'}
                    </p>
                    
                    {user.role === 'operator' && myTours.length > 0 && (
                      <label className="flex items-start gap-3 p-3 bg-red-50 rounded-lg mb-4 cursor-pointer hover:bg-red-100/50 transition-colors border border-red-100">
                        <input 
                          type="checkbox" 
                          checked={deleteToursChecked}
                          onChange={(e) => setDeleteToursChecked(e.target.checked)}
                          className="mt-1 w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500 cursor-pointer"
                        />
                        <span className="text-xs text-red-800 font-semibold leading-relaxed">
                          {isKa 
                            ? `ვადასტურებ, რომ ჩემი ${myTours.length} ტური სამუდამოდ წაიშლება ანგარიშთან ერთად.` 
                            : `I acknowledge that my ${myTours.length} published tours will be permanently deleted along with my account.`}
                        </span>
                      </label>
                    )}

                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setShowDeleteConfirm(false); setDeleteToursChecked(false); }}
                        className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors"
                        disabled={isDeletingAccount}
                      >
                        {isKa ? 'გაუქმება' : 'Cancel'}
                      </button>
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount || (user.role === 'operator' && myTours.length > 0 && !deleteToursChecked)}
                        className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-black rounded-lg text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isDeletingAccount ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                            {isKa ? 'სამუდამოდ წაშლა' : 'Delete Permanently'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-700 font-black text-sm flex items-center gap-2 hover:underline bg-white px-4 py-2 rounded-lg border border-red-200 shadow-sm transition-all hover:shadow-md w-fit"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    {isKa ? 'ანგარიშის წაშლა' : 'Delete Account'}
                  </button>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'security' ? (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto md:mx-0"
            >
              <h2 className="text-2xl font-black text-text-main mb-8 flex items-center gap-3">
                <span className="w-8 h-1 bg-primary rounded-full"></span>
                {isKa ? 'პაროლის შეცვლა' : 'Change Password'}
              </h2>

              <div className="bg-white rounded-3xl p-8 shadow-xl border border-border-light space-y-8">
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-3">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    securityStep === 'verify' ? 'bg-primary text-white shadow-lg' : securityStep === 'password' || securityStep === 'done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">{securityStep !== 'verify' ? 'check_circle' : 'phone_android'}</span>
                    {isKa ? 'ვერიფიკაცია' : 'Verify'}
                  </div>
                  <div className="w-8 h-0.5 bg-gray-200"></div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    securityStep === 'password' ? 'bg-primary text-white shadow-lg' : securityStep === 'done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">{securityStep === 'done' ? 'check_circle' : 'lock'}</span>
                    {isKa ? 'ახალი პაროლი' : 'New Password'}
                  </div>
                </div>

                {/* Step 0: Start */}
                {securityStep === 'start' && (
                  <div className="text-center space-y-6 animate-fade-in py-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-5xl text-primary font-black">lock_reset</span>
                    </div>
                    <h3 className="text-xl font-black text-text-main mb-2">
                      {isKa ? 'გსურთ პაროლის შეცვლა?' : 'Change Your Password?'}
                    </h3>
                    <p className="text-text-muted font-medium max-w-sm mx-auto mb-6">
                      {isKa ? 'უსაფრთხოებისთვის, გთხოვთ შეიყვანოთ თქვენი ანგარიშის ელ-ფოსტა:' : 'For your security, please type your account email address:'}
                    </p>
                    <div className="max-w-xs mx-auto space-y-4">
                      <input
                        type="email"
                        value={typedEmail}
                        onChange={(e) => setTypedEmail(e.target.value)}
                        className="w-full text-center p-4 rounded-2xl bg-gray-50 border-2 border-primary/20 focus:border-primary outline-none transition-all font-bold"
                        placeholder="your@email.com"
                      />
                      {passwordError && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium animate-fade-in border border-red-100 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">error</span>
                          {passwordError}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleSendVerification}
                        disabled={isSavingPassword || typedEmail.toLowerCase() !== user.email.toLowerCase()}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                        {isSavingPassword ? (
                          <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">send</span>
                            {isKa ? 'კოდის გაგზავნა' : 'Send Verification Code'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 1: Verify Email */}
                {securityStep === 'verify' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-primary">mail</span>
                      </div>
                      <h3 className="text-lg font-black text-text-main mb-1">
                        {isKa ? 'ვერიფიკაციის კოდი' : 'Enter Verification Code'}
                      </h3>
                      <p className="text-sm text-text-muted font-medium">
                        {isKa ? 'შეიყვანეთ 4-ნიშნა კოდი, რომელიც გაიგზავნა ელ-ფოსტაზე:' : 'Enter the 4-digit code sent to your email:'}
                        {user.email && <span className="block text-primary font-black mt-1">{user.email}</span>}
                      </p>
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-text-main text-center text-3xl font-black tracking-[1em] px-4 py-5 rounded-2xl border-2 border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-300 bg-gray-50"
                      placeholder="0000"
                      autoFocus
                    />
                    <div className="flex justify-center">
                      <button 
                        type="button" 
                        onClick={handleSendVerification}
                        disabled={isSavingPassword}
                        className="text-primary text-xs font-black hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                        {isKa ? 'კოდის ხელახლა გაგზავნა' : 'Resend Code'}
                      </button>
                    </div>
                    {passwordError && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium animate-fade-in border border-red-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {passwordError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isSavingPassword || verificationCode.length !== 4}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {isSavingPassword ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">verified</span>
                          {isKa ? 'დადასტურება' : 'Verify Identity'}
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSecurityStep('start')}
                      className="w-full text-sm font-bold text-text-muted hover:text-text-main transition-colors"
                    >
                      {isKa ? 'უკან' : 'Go Back'}
                    </button>
                  </div>
                )}

                {/* Step 2: Enter New Password */}
                {securityStep === 'password' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
                      </div>
                      <h3 className="text-lg font-black text-text-main mb-1">
                        {isKa ? 'ვერიფიკაცია წარმატებულია!' : 'Identity Verified!'}
                      </h3>
                      <p className="text-sm text-text-muted font-medium">
                        {isKa ? 'ახლა შეიყვანეთ თქვენი ახალი პაროლი' : 'Now enter your new password'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                        {isKa ? 'ახალი პაროლი' : 'New Password'}
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                        className="w-full text-text-main p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all font-bold"
                        placeholder={isKa ? 'შეიყვანეთ ახალი პაროლი' : 'Enter new password'}
                        autoFocus
                      />
                    </div>
                    {newPassword && (
                      <div className="space-y-2 p-4 bg-surface-dark/5 rounded-2xl border border-border-light">
                        <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.length ? 'text-green-600' : 'text-text-muted'}`}>
                          <span className="material-symbols-outlined text-[16px]">{isPasswordValid.length ? 'check_circle' : 'radio_button_unchecked'}</span>
                          {isKa ? 'მინიმუმ 8 სიმბოლო' : 'At least 8 characters'}
                        </div>
                        <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.uppercase ? 'text-green-600' : 'text-text-muted'}`}>
                          <span className="material-symbols-outlined text-[16px]">{isPasswordValid.uppercase ? 'check_circle' : 'radio_button_unchecked'}</span>
                          {isKa ? 'მინიმუმ 1 დიდი ასო (A-Z)' : '1 uppercase letter (A-Z)'}
                        </div>
                        <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.number ? 'text-green-600' : 'text-text-muted'}`}>
                          <span className="material-symbols-outlined text-[16px]">{isPasswordValid.number ? 'check_circle' : 'radio_button_unchecked'}</span>
                          {isKa ? 'მინიმუმ 1 ციფრი (0-9)' : '1 number (0-9)'}
                        </div>
                        <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.special ? 'text-green-600' : 'text-text-muted'}`}>
                          <span className="material-symbols-outlined text-[16px]">{isPasswordValid.special ? 'check_circle' : 'radio_button_unchecked'}</span>
                          {isKa ? 'მინიმუმ 1 სპეციალური სიმბოლო' : '1 special symbol'}
                        </div>
                      </div>
                    )}
                    {passwordError && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium animate-fade-in border border-red-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {passwordError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveNewPassword}
                      disabled={isSavingPassword || !allPasswordValid}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {isSavingPassword ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">save</span>
                          {isKa ? 'პაროლის შენახვა' : 'Save New Password'}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Step 3: Success */}
                {securityStep === 'done' && (
                  <div className="text-center space-y-4 animate-fade-in py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
                    </div>
                    <h3 className="text-xl font-black text-text-main">
                      {isKa ? 'პაროლი წარმატებით შეიცვალა!' : 'Password Changed Successfully!'}
                    </h3>
                    <p className="text-sm text-text-muted font-medium">
                      {isKa ? 'თქვენი პაროლი განახლებულია. შემდეგ შესვლისას გამოიყენეთ ახალი პაროლი.' : 'Your password has been updated. Use your new password next time you log in.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="mt-4 px-8 py-3 bg-primary/10 text-primary rounded-xl font-black hover:bg-primary/20 transition-all"
                    >
                      {isKa ? 'პარამეტრები' : 'Back to Settings'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {tourToDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-border-light relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-500 text-3xl">delete_sweep</span>
              </div>
              <h3 className="text-xl font-black text-center text-text-main mb-2">
                {isKa ? 'გსურთ ტურის წაშლა?' : 'Delete this tour?'}
              </h3>
              <p className="text-sm text-text-muted text-center font-medium mb-6">
                {isKa ? 'ეს ქმედება სამუდამოა და ვეღარ აღადგენთ.' : 'This action is permanent and cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTourToDelete(null)}
                  disabled={isDeletingTour}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  {isKa ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={confirmDeleteTour}
                  disabled={isDeletingTour}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-black rounded-xl shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isDeletingTour ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      {isKa ? 'წაშლა' : 'Delete'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
