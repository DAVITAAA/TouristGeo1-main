import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../translations';
import { User, fetchMyBookings, updateMe, uploadAvatar, fetchMyTours, deleteTour, initiatePasswordChange, completePasswordChange, deleteAccount, Reservation, fetchOperatorReservations, markReservationRead, markAllReservationsRead, renewTour, getMyExpiredTours, getToken, fetchPendingVerifications, updateVerificationStatus } from '../api';
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
  const [activeTab, setActiveTab] = useState<'settings' | 'favorites' | 'my-tours' | 'reservations' | 'expired-tours' | 'verification' | 'admin-dashboard'>(
    user.role === 'operator' ? 'my-tours' : 'favorites'
  );
  const ADMIN_EMAIL = 'datonaxucrishvili64@gmail.com';
  const isAdmin = user.email === ADMIN_EMAIL;
  
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const { wishlist: favorites } = useWishlist(!!user);
  const [myTours, setMyTours] = useState<any[]>([]);
  const [expiredTours, setExpiredTours] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRenewingTour, setIsRenewingTour] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
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

  // Verification state
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  const [tourToDelete, setTourToDelete] = useState<number | null>(null);
  const [isDeletingTour, setIsDeletingTour] = useState(false);

  // Reservations Tab State
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);

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
    if (user.role === 'operator') {
      fetchMyTours().then(setMyTours).catch(console.error);
      getMyExpiredTours().then(setExpiredTours).catch(console.error);
    }
  }, [activeTab, user.role]);

  // Load reservations when the tab is active
  useEffect(() => {
    if (activeTab === 'reservations' && user.role === 'operator') {
      setIsLoadingReservations(true);
      fetchOperatorReservations(user.id)
        .then(setReservations)
        .catch(console.error)
        .finally(() => setIsLoadingReservations(false));
    }
  }, [activeTab, user.id, user.role]);

  // Load pending verifications for admin
  useEffect(() => {
    if (activeTab === 'admin-dashboard' && isAdmin) {
      setIsLoading(true);
      fetchPendingVerifications()
        .then(setPendingVerifications)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [activeTab, isAdmin]);

  const handleVerifyOperator = async (profileId: string, status: 'verified' | 'rejected') => {
    setIsApproving(profileId);
    try {
      await updateVerificationStatus(profileId, status);
      setPendingVerifications(prev => prev.filter(p => p.id !== profileId));
      setToast({ 
        message: status === 'verified' ? (isKa ? 'ოპერატორი ვერიფიცირებულია!' : 'Operator verified!') : (isKa ? 'მოთხოვნა უარყოფილია' : 'Request rejected'), 
        type: 'success' 
      });
    } catch (err) {
      setToast({ message: isKa ? 'შეცდომა განახლებისას' : 'Failed to update status', type: 'error' });
    } finally {
      setIsApproving(null);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markReservationRead(id);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'read' } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReservationsRead(user.id);
      setReservations(prev => prev.map(r => ({ ...r, status: 'read' })));
      setToast({ message: isKa ? 'ყველა მონიშნულია წაკითხულად' : 'All marked as read', type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

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

  const getExpirationInfo = (createdAt: string) => {
    const created = new Date(createdAt);
    const expires = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return {
      published: created.toLocaleDateString(isKa ? 'ka-GE' : 'en-US'),
      expires: expires.toLocaleDateString(isKa ? 'ka-GE' : 'en-US'),
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      isUrgent: daysLeft <= 5
    };
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

  const handleRenew = async () => {
    if (!isRenewingTour) return;
    setIsProcessingPayment(true);
    
    try {
      // Fake payment delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await renewTour(isRenewingTour.id);
      
      setToast({ message: isKa ? 'ტური წარმატებით განახლდა!' : 'Tour renewed successfully!', type: 'success' });
      setShowPaymentModal(false);
      
      // Update local state: move from expired to active
      setExpiredTours(prev => prev.filter(t => t.id !== isRenewingTour.id));
      setMyTours(prev => [isRenewingTour, ...prev]);
      
      setIsRenewingTour(null);
    } catch (err: any) {
      setToast({ message: isKa ? `შეცდომა განახლებისას: ${err.message}` : `Error renewing tour: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleVerifyRequest = async () => {
    if (!verificationDoc) return;
    setIsSubmittingVerification(true);
    try {
      // 1. Upload the doc
      const uploadFormData = new FormData();
      uploadFormData.append('file', verificationDoc);
      uploadFormData.append('bucket', 'tours'); // Reuse tours bucket for now

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: uploadFormData
      });
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.error);

      // 2. Submit verification request
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ document_url: uploadData.url })
      });
      const verifyData = await verifyRes.json();
      if (verifyData.error) throw new Error(verifyData.error);

      setToast({ message: isKa ? 'მოთხოვნა გაგზავნილია!' : 'Verification request submitted!', type: 'success' });
      onUpdateUser({ verification_status: 'pending' });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSubmittingVerification(false);
      setVerificationDoc(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24 z-20">
            {/* Profile Brief Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 border border-border-light relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-primary font-black">person</span>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white shadow-md border border-border-light flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-text-main truncate mb-0.5">{user.name}</h2>
                  <p className="text-[11px] font-bold text-text-muted truncate mb-2">{user.email}</p>
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {user.role === 'operator' 
                      ? (isKa ? 'ოპერატორი' : 'Operator') 
                      : (isKa ? 'ტურისტი' : 'Traveler')}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="bg-white rounded-3xl p-2 shadow-xl border border-border-light flex lg:flex-col overflow-x-auto no-scrollbar gap-1">
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 lg:flex-none py-4 px-5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === 'favorites' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-gray-50 hover:text-text-main'}`}
              >
                <span className="material-symbols-outlined text-[20px]">favorite</span>
                {isKa ? 'რჩეულები' : 'Favorites'}
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 lg:flex-none py-4 px-5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-gray-50 hover:text-text-main'}`}
              >
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                {isKa ? 'პარამეტრები' : 'Account & Security'}
              </button>
              
              {user.role === 'operator' && (
                <>
                  <div className="hidden lg:block h-px bg-gray-100 my-2 mx-4"></div>
                  
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className={`flex-1 lg:flex-none py-4 px-5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-3 relative whitespace-nowrap ${activeTab === 'reservations' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-gray-50 hover:text-text-main'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">event_note</span>
                    {isKa ? 'რეზერვაციები' : 'Reservations'}
                    {reservations.filter(r => r.status === 'new').length > 0 && (
                      <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-white">
                        {reservations.filter(r => r.status === 'new').length}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('my-tours')}
                    className={`flex-1 lg:flex-none py-4 px-5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === 'my-tours' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-gray-50 hover:text-text-main'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">tour</span>
                    {isKa ? 'ჩემი ტურები' : 'My Tours'}
                  </button>

                  <button
                    onClick={() => setActiveTab('expired-tours')}
                    className={`flex-1 lg:flex-none py-4 px-5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-3 relative whitespace-nowrap ${activeTab === 'expired-tours' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-gray-50 hover:text-text-main'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">history</span>
                    {isKa ? 'ვადაგასული' : 'Expired'}
                    {expiredTours.length > 0 && (
                      <span className="absolute top-3 right-3 w-5 h-5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-white">
                        {expiredTours.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`flex-1 lg:flex-none py-4 px-5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-3 relative whitespace-nowrap ${activeTab === 'verification' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-gray-50 hover:text-text-main'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                    {isKa ? 'ვერიფიკაცია' : 'Trust & Safety'}
                    {user.is_verified && (
                      <span className="absolute top-3 right-3 w-5 h-5 bg-blue-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        <span className="material-symbols-outlined text-[10px] filled">verified</span>
                      </span>
                    )}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setActiveTab('admin-dashboard')}
                      className={`flex-1 lg:flex-none py-4 px-5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-3 relative whitespace-nowrap ${activeTab === 'admin-dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-text-muted hover:bg-gray-50 hover:text-text-main'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                      {isKa ? 'ადმინ პანელი' : 'Admin Panel'}
                      {pendingVerifications.length > 0 && (
                        <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-white">
                          {pendingVerifications.length}
                        </span>
                      )}
                    </button>
                  )}
                </>
              )}

              <div className="hidden lg:block h-px bg-gray-100 my-2 mx-4"></div>
              
              <button
                onClick={onLogout}
                className="flex-1 lg:flex-none py-4 px-5 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center gap-3 text-red-500 hover:bg-red-50 whitespace-nowrap mt-auto"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                {isKa ? 'გასვლა' : 'Logout'}
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
          {activeTab === 'my-tours' && user.role === 'operator' ? (
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
                        
                        {tour.created_at && (
                          <div className="flex flex-wrap gap-3 mb-4">
                            <div className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                              <p className="text-[9px] font-black text-text-muted uppercase tracking-tighter mb-0.5">{isKa ? 'გამოქვეყნდა' : 'Published'}</p>
                              <p className="text-xs font-bold text-text-main">{getExpirationInfo(tour.created_at).published}</p>
                            </div>
                            <div className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                              <p className="text-[9px] font-black text-text-muted uppercase tracking-tighter mb-0.5">{isKa ? 'იწურება' : 'Expires'}</p>
                              <p className="text-xs font-bold text-text-main">{getExpirationInfo(tour.created_at).expires}</p>
                            </div>
                            <div className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${getExpirationInfo(tour.created_at).isUrgent ? 'bg-red-50 border-red-100 text-red-700' : 'bg-primary/5 border-primary/10 text-primary'}`}>
                              <span className="material-symbols-outlined text-[16px] font-black">{getExpirationInfo(tour.created_at).isUrgent ? 'timer' : 'schedule'}</span>
                              <p className="text-xs font-black uppercase tracking-widest">
                                {getExpirationInfo(tour.created_at).daysLeft} {isKa ? 'დღე დარჩა' : 'Days Left'}
                              </p>
                            </div>
                          </div>
                        )}
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
          ) : activeTab === 'expired-tours' && user.role === 'operator' ? (
            <motion.div
              key="expired-tours"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                 <h2 className="text-2xl font-black text-text-main flex items-center gap-3">
                   <span className="w-8 h-1 bg-amber-500 rounded-full"></span>
                   {isKa ? 'ვადაგასული ტურები' : 'Expired Tours'}
                   <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-lg">
                     {expiredTours.length} {isKa ? 'ჯამში' : 'total'}
                   </span>
                 </h2>
              </div>

              {expiredTours.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <span className="material-symbols-outlined text-5xl">history</span>
                  </div>
                  <h3 className="text-xl font-black text-text-main mb-2">
                    {isKa ? 'ვადაგასული ტურები არ არის' : 'No expired tours found'}
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {expiredTours.map((tour) => (
                    <div key={tour.id} className="group flex flex-col md:flex-row gap-6 bg-white p-6 rounded-3xl border border-border-light shadow-sm hover:shadow-lg transition-all relative overflow-hidden grayscale-[0.5] opacity-80 hover:grayscale-0 hover:opacity-100">
                      <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0">
                        <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-start gap-4">
                           <h4 className="font-black text-xl text-text-main mb-1 truncate">{tour.title}</h4>
                           <span className="px-3 py-1 text-[10px] shrink-0 font-black uppercase tracking-widest rounded-lg bg-amber-100 text-amber-700">EXPIRED</span>
                        </div>
                        <p className="text-xs font-bold text-text-muted flex items-center gap-1 mb-4 uppercase tracking-widest mt-1">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          {tour.location}
                        </p>
                        
                        {tour.created_at && (
                          <div className="bg-amber-50/50 px-3 py-2 rounded-xl border border-amber-100 w-fit mb-4">
                             <p className="text-[9px] font-black text-amber-700 uppercase tracking-tighter mb-0.5">{isKa ? 'თავდაპირველად გამოქვეყნდა' : 'Originally Published'}</p>
                             <p className="text-xs font-bold text-amber-900">{getExpirationInfo(tour.created_at).published}</p>
                          </div>
                        )}
                        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                           <p className="font-black text-primary flex items-center gap-1">
                              {getCurrencySymbol(targetCurrency)}{convertPrice(tour.price, targetCurrency)}
                           </p>
                           <button 
                            onClick={() => { setIsRenewingTour(tour); setShowPaymentModal(true); }}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                           >
                              <span className="material-symbols-outlined text-[18px]">publish</span>
                              {isKa ? 'განახლება' : 'Renew / Re-upload'}
                           </button>
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

              {/* Security Section (Unified) */}
              <div className="mt-12 pt-12 border-t-2 border-dashed border-gray-100">
                <h2 className="text-2xl font-black text-text-main mb-8 flex items-center gap-3">
                  <span className="w-8 h-1 bg-primary rounded-full"></span>
                  {isKa ? 'პაროლის შეცვლა' : 'Security & Password'}
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
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium animate-fade-in border border-red-100 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">error</span>
                          {passwordError}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={isSavingPassword || verificationCode.length !== 4}
                        className="w-full mt-6 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                        {isSavingPassword ? (
                          <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">verified</span>
                            {isKa ? 'დადასტურება' : 'Verify Identity'}
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Step 2: New Password */}
                  {securityStep === 'password' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 gap-6">
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
                          <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.number ? 'text-green-600' : 'text-gray-400'}`}>
                            <span className="material-symbols-outlined text-[16px]">{isPasswordValid.number ? 'check_circle' : 'radio_button_unchecked'}</span>
                            {isKa ? 'მინიმუმ 1 ციფრი (0-9)' : '1 number (0-9)'}
                          </div>
                          <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.special ? 'text-green-600' : 'text-gray-400'}`}>
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
                        {passwordSuccess}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 p-8 rounded-3xl bg-red-50 border border-red-100">
                <h3 className="text-red-800 font-black mb-2 flex items-center gap-3 text-lg">
                  <span className="material-symbols-outlined text-2xl">dangerous</span>
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
          ) : activeTab === 'reservations' && user.role === 'operator' ? (
            <motion.div
              key="reservations"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-black text-text-main flex items-center gap-3">
                  <span className="w-8 h-1 bg-primary rounded-full"></span>
                  {isKa ? 'რეზერვაციის მოთხოვნები' : 'Reservation Requests'}
                  <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-lg">
                    {reservations.length} {isKa ? 'ჯამში' : 'total'}
                  </span>
                </h2>
                {reservations.some(r => r.status === 'new') && (
                  <button
                    onClick={handleMarkAllRead}
                    className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl font-black text-sm hover:bg-primary/20 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                    {isKa ? 'ყველას წაკითხულად მონიშვნა' : 'Mark All Read'}
                  </button>
                )}
              </div>

              {isLoadingReservations ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                  <p className="font-bold text-text-muted italic">{isKa ? 'იტვირთება...' : 'Loading reservations...'}</p>
                </div>
              ) : reservations.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <span className="material-symbols-outlined text-5xl">event_busy</span>
                  </div>
                  <h3 className="text-xl font-black text-text-main mb-2">
                    {isKa ? 'რეზერვაციები არ არის' : 'No reservations yet'}
                  </h3>
                  <p className="text-text-muted mb-8 max-w-sm mx-auto font-medium">
                    {isKa
                      ? 'როცა ტურისტი გამოგიგზავნით რეზერვაციის მოთხოვნას, ის აქ გამოჩნდება.'
                      : 'When tourists send you reservation requests, they will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {reservations.map((res) => {
                    const isNew = res.status === 'new';
                    const isExpanded = expandedReservation === res.id;
                    const createdDate = new Date(res.created_at);
                    const formattedDate = createdDate.toLocaleDateString(isKa ? 'ka-GE' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                    const formattedTime = createdDate.toLocaleTimeString(isKa ? 'ka-GE' : 'en-US', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <motion.div
                        layout
                        key={res.id}
                        className={`bg-white rounded-3xl shadow-lg border overflow-hidden transition-all cursor-pointer hover:shadow-xl ${
                          isNew ? 'border-primary/30 ring-2 ring-primary/10' : 'border-border-light'
                        }`}
                        onClick={() => {
                          setExpandedReservation(isExpanded ? null : res.id);
                          if (isNew) handleMarkRead(res.id);
                        }}
                      >
                        {/* Card Header */}
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Tour thumbnail */}
                            <div className="w-full sm:w-20 h-28 sm:h-20 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                              <img src={res.tour_image} alt={res.tour_title} className="w-full h-full object-cover" />
                            </div>

                            {/* Main info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                  <h3 className="font-black text-lg text-text-main truncate leading-tight">
                                    {res.tourist_name} {res.tourist_surname}
                                  </h3>
                                  <p className="text-sm font-bold text-text-muted truncate mt-0.5">
                                    {res.tour_title}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                                    isNew
                                      ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {isNew
                                      ? (isKa ? '● ახალი' : '● New')
                                      : (isKa ? 'ნანახი' : 'Viewed')}
                                  </span>
                                </div>
                              </div>

                              {/* Quick info row */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-bold text-text-muted">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-primary">calendar_month</span>
                                  {res.start_date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                                  {res.duration_days} {isKa ? 'დღე' : 'days'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-primary">groups</span>
                                  {res.guests} {isKa ? 'სტუმარი' : 'guests'}
                                </span>
                                <span className="flex items-center gap-1 ml-auto text-[10px] text-gray-400">
                                  {formattedDate} · {formattedTime}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 sm:px-6 pb-6 border-t border-gray-100 pt-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                  {/* Contact Info */}
                                  <div className="space-y-3">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                      {isKa ? 'საკონტაქტო ინფორმაცია' : 'Contact Information'}
                                    </p>
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                          <span className="material-symbols-outlined text-primary text-[16px]">call</span>
                                        </div>
                                        <div>
                                          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{isKa ? 'ტელეფონი' : 'Phone'}</p>
                                          <a href={`tel:${res.tourist_phone}`} className="font-black text-sm text-text-main hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                                            {res.tourist_phone}
                                          </a>
                                        </div>
                                      </div>
                                      {res.tourist_email && (
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-blue-500 text-[16px]">mail</span>
                                          </div>
                                          <div>
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{isKa ? 'ელ-ფოსტა' : 'Email'}</p>
                                            <a href={`mailto:${res.tourist_email}`} className="font-black text-sm text-text-main hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                                              {res.tourist_email}
                                            </a>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Tour & Trip Details */}
                                  <div className="space-y-3">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                      {isKa ? 'ტურის დეტალები' : 'Trip Details'}
                                    </p>
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                          <span className="material-symbols-outlined text-amber-500 text-[16px]">location_on</span>
                                        </div>
                                        <div>
                                          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{isKa ? 'ლოკაცია' : 'Location'}</p>
                                          <p className="font-black text-sm text-text-main">{res.tour_location}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                          <span className="material-symbols-outlined text-purple-500 text-[16px]">date_range</span>
                                        </div>
                                        <div>
                                          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{isKa ? 'პერიოდი' : 'Period'}</p>
                                          <p className="font-black text-sm text-text-main">{res.start_date} → {res.duration_days} {isKa ? 'დღე' : 'days'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Description */}
                                {res.description && (
                                  <div className="mt-5">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                                      {isKa ? 'დამატებითი შენიშვნები' : 'Additional Notes'}
                                    </p>
                                    <div className="bg-gray-50 rounded-2xl p-4">
                                      <p className="text-sm text-text-main font-medium leading-relaxed">{res.description}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-5 flex flex-wrap gap-3">
                                  <a
                                    href={`tel:${res.tourist_phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 min-w-[140px] py-3 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">call</span>
                                    {isKa ? 'დარეკვა' : 'Call Now'}
                                  </a>
                                  {res.tourist_email && (
                                    <a
                                      href={`mailto:${res.tourist_email}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 min-w-[140px] py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-black text-sm hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">mail</span>
                                      {isKa ? 'ელ-ფოსტა' : 'Send Email'}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'verification' && user.role === 'operator' ? (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex flex-wrap items-center justify-between mb-2 gap-4">
                 <h2 className="text-2xl font-black text-text-main flex items-center gap-3">
                   <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
                   {isKa ? 'ვერიფიკაცია და ნდობა' : 'Trust & Verification'}
                 </h2>
              </div>

              {/* Status Banner */}
              <div className={`p-8 rounded-[32px] border-2 flex flex-col md:flex-row items-center gap-8 transition-all ${
                user.is_verified 
                  ? 'bg-blue-50 border-blue-100 text-blue-900' 
                  : user.verification_status === 'pending'
                  ? 'bg-amber-50 border-amber-100 text-amber-900'
                  : user.verification_status === 'rejected'
                  ? 'bg-red-50 border-red-100 text-red-900'
                  : 'bg-white border-border-light text-text-main'
              }`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                   user.is_verified ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="material-symbols-outlined text-[48px] filled">
                    {user.is_verified ? 'verified' : 'shield_person'}
                  </span>
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h3 className="text-2xl font-black">
                    {user.is_verified 
                      ? (isKa ? 'თქვენ ვერიფიცირებული ხართ!' : 'You are Verified!') 
                      : user.verification_status === 'pending'
                      ? (isKa ? 'ვერიფიკაცია პროცესშია' : 'Verification Pending')
                      : (isKa ? 'გახდით ვერიფიცირებული' : 'Get Verified')}
                  </h3>
                  <p className="text-sm font-medium opacity-80 leading-relaxed">
                    {user.is_verified 
                      ? (isKa ? 'თქვენს ყველა ტურს ექნება ლურჯი ნიშანი, რაც ზრდის მომხმარებლების ნდობას და გაყიდვებს.' : 'All your tours now display a blue badge, increasing traveler trust and booking rates.') 
                      : (isKa ? 'ატვირთეთ საბუთები ან მიიღეთ ვერიფიკაცია ავტომატურად 50+ შეფასებისა და 4.5+ რეიტინგის შემდეგ.' : 'Upload documents or get verified automatically after reaching 50+ reviews with a 4.5+ average rating.')}
                  </p>
                </div>

                {user.is_verified && (
                  <div className="bg-white/50 backdrop-blur-sm px-6 py-4 rounded-2xl border border-blue-200 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                    <p className="text-xl font-black text-blue-600">PRO OPERATOR</p>
                  </div>
                )}
              </div>

              {!user.is_verified && user.verification_status !== 'pending' && (
                <div className="bg-white rounded-[32px] p-8 border border-border-light shadow-sm space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
                      {isKa ? 'ატვირთეთ დოკუმენტი (ID / ლიცენზია)' : 'Upload Document (ID / License)'}
                    </label>
                    <div className="relative group">
                      <div className={`w-full aspect-[3/1] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${verificationDoc ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50 group-hover:border-primary/50'}`}>
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">{verificationDoc ? 'check_circle' : 'cloud_upload'}</span>
                        <p className="text-sm font-black text-text-muted">
                          {verificationDoc ? verificationDoc.name : (isKa ? 'აირჩიეთ ფაილი (PDF, JPG, PNG)' : 'Select File (PDF, JPG, PNG)')}
                        </p>
                        <input 
                          type="file" 
                          onChange={(e) => e.target.files && setVerificationDoc(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleVerifyRequest}
                    disabled={!verificationDoc || isSubmittingVerification}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-3"
                  >
                    {isSubmittingVerification ? (
                      <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">send</span>
                        {isKa ? 'მოთხოვნის გაგზავნა' : 'Submit Verification Request'}
                      </>
                    )}
                  </button>
                  
                  <p className="text-[10px] text-text-muted font-bold text-center leading-relaxed px-10">
                    {isKa ? 'თქვენი დოკუმენტები დაცულია და გამოიყენება მხოლოდ ვერიფიკაციისთვის. განხილვას სჭირდება 24-48 საათი.' : 'Your documents are encrypted and used only for verification purposes. Review takes 24-48 hours.'}
                  </p>
                </div>
              )}

              {user.verification_status === 'pending' && (
                <div className="bg-amber-50 rounded-[32px] p-10 border border-amber-100 text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h4 className="text-xl font-black text-amber-900">{isKa ? 'განხილვა პროცესშია' : 'Under Review'}</h4>
                  <p className="text-sm text-amber-700 font-medium max-w-sm mx-auto">
                    {isKa ? 'თქვენი მოთხოვნა მიღებულია. ჩვენ დაგიკავშირდებით ან მოგცემთ ნიშანს უახლოეს 48 საათში.' : 'We have received your documents. Our team is reviewing them. You will see the badge once approved (usually within 48h).'}
                  </p>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'admin-dashboard' && isAdmin ? (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-600/20">
                <h3 className="text-2xl font-black mb-2">{isKa ? 'ადმინ პანელი' : 'Admin Dashboard'}</h3>
                <p className="text-indigo-100 font-bold">{isKa ? 'ოპერატორების ვერიფიკაციის მართვა' : 'Manage operator verification requests'}</p>
              </div>

              <div className="grid gap-6">
                {pendingVerifications.length === 0 ? (
                  <div className="bg-white rounded-[32px] p-20 border border-border-light text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-4xl text-gray-300">done_all</span>
                    </div>
                    <p className="text-lg font-black text-text-muted">{isKa ? 'მოდერაციისთვის არაფერია' : 'No pending requests'}</p>
                  </div>
                ) : (
                  pendingVerifications.map((profile) => (
                    <div key={profile.id} className="bg-white rounded-3xl p-6 border border-border-light shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-indigo-300">person</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-text-main">{profile.name}</h4>
                          <p className="text-xs font-bold text-text-muted">{profile.email}</p>
                          <p className="text-[10px] font-black text-indigo-600 uppercase mt-1">Operator</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <a 
                          href={profile.verification_document} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-5 py-3 bg-gray-100 text-text-main rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-gray-200 transition-all"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                          {isKa ? 'საბუთის ნახვა' : 'View Document'}
                        </a>
                        
                        <button
                          onClick={() => handleVerifyOperator(profile.id, 'verified')}
                          disabled={isApproving === profile.id}
                          className="px-5 py-3 bg-green-500 text-white rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          {isApproving === profile.id ? '...' : (isKa ? 'დადასტურება' : 'Approve')}
                        </button>

                        <button
                          onClick={() => handleVerifyOperator(profile.id, 'rejected')}
                          disabled={isApproving === profile.id}
                          className="px-5 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-red-100 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                          {isKa ? 'უარყოფა' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
          </div>
        </div>
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

      {/* Payment Modal for Renewal */}
      <AnimatePresence>
        {showPaymentModal && isRenewingTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowPaymentModal(false); setIsRenewingTour(null); }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 50, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 50, scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[40px] p-1 shadow-2xl max-w-lg w-full overflow-hidden relative"
            >
              <div className="bg-gradient-to-br from-primary to-green-600 p-8 text-white rounded-[36px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
                
                <button 
                  onClick={() => { setShowPaymentModal(false); setIsRenewingTour(null); }}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors z-20"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>

                <div className="relative z-10">
                  <h3 className="text-3xl font-black mb-2">{isKa ? 'ტურის განახლება' : 'Renew Your Tour'}</h3>
                  <p className="text-white/80 font-bold uppercase tracking-widest text-[10px]">
                    {isKa ? 'გაახანგრძლივეთ 1 თვით' : 'Extend visibility for 1 month'}
                  </p>
                  
                  <div className="mt-8 flex items-end gap-2">
                    <span className="text-5xl font-black">29</span>
                    <span className="text-xl font-black mb-1">GEL</span>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="w-8" alt="Visa" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-text-muted uppercase tracking-tighter">{isKa ? 'ბარათის ნომერი' : 'Card Number'}</p>
                      <p className="font-bold text-text-main tracking-widest">•••• •••• •••• 4242</p>
                    </div>
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-tighter mb-1">{isKa ? 'ვადა' : 'Expiry'}</p>
                      <p className="font-bold text-text-main">12 / 28</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-tighter mb-1">CVC</p>
                      <p className="font-bold text-text-main">***</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                  <span className="material-symbols-outlined text-amber-500">info</span>
                  <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                    {isKa 
                      ? 'ეს არის გადახდის დემონსტრაცია. რეალური თანხა არ ჩამოგეჭრებათ.' 
                      : 'This is a payment demonstration. No real funds will be deducted.'}
                  </p>
                </div>

                <button
                  onClick={handleRenew}
                  disabled={isProcessingPayment}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  {isProcessingPayment ? (
                    <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">payments</span>
                      {isKa ? 'გადახდა და განახლება' : 'Pay & Renew Now'}
                    </>
                  )}
                </button>
                
                <p className="text-center text-[10px] text-text-muted font-bold uppercase tracking-widest">
                  Secure payment powered by GeoPay
                </p>
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
