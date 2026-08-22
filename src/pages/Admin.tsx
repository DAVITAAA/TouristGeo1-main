import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Language, translations } from '../translations';
import { 
  User, 
  fetchAdminStats, 
  fetchAdminUsers, 
  updateAdminUserRole, 
  updateAdminUserVerify, 
  deleteAdminUser, 
  fetchAdminTours, 
  updateAdminTourStatus, 
  deleteAdminTour, 
  fetchAdminReservations, 
  fetchAdminReviews, 
  deleteAdminReview 
} from '../api';
import Toast from '../components/Toast';

interface AdminProps {
  user: User;
  language: Language;
  onNavigate: (page: string, data?: any) => void;
}

export default function Admin({ user, language, onNavigate }: AdminProps) {
  const t = translations[language];
  const isKa = language === 'ka';

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tours' | 'reservations' | 'reviews'>('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Data states
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalTours: 0,
    totalReservations: 0,
    totalReviews: 0,
    operators: 0,
    verifiedOperators: 0,
    activeTours: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [tourStatusFilter, setTourStatusFilter] = useState<string>('all');

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminTours(),
        fetchAdminReservations(),
        fetchAdminReviews(),
      ]);

      if (results[0].status === 'fulfilled') setStats(results[0].value);
      if (results[1].status === 'fulfilled') setUsers(results[1].value || []);
      if (results[2].status === 'fulfilled') setTours(results[2].value || []);
      if (results[3].status === 'fulfilled') setReservations(results[3].value || []);
      if (results[4].status === 'fulfilled') setReviews(results[4].value || []);

      const rejected = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
      if (rejected) {
        console.warn('Some admin data failed to load:', rejected.reason);
      }
    } catch (err: any) {
      setToast({ 
        message: isKa ? `შეცდომა მონაცემების ჩატვირთვისას: ${err.message}` : `Error loading admin data: ${err.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl">
          <span className="material-symbols-outlined text-red-500 text-6xl mb-4">admin_panel_settings</span>
          <h2 className="text-2xl font-black text-white mb-2 font-display">
            {isKa ? 'წვდომა შეზღუდულია' : 'Access Denied'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {isKa ? 'ამ გვერდზე შესასვლელად საჭიროა ადმინისტრატორის უფლებები.' : 'Administrative privileges are required to view this dashboard.'}
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all"
          >
            {isKa ? 'მთავარ გვერდზე დაბრუნება' : 'Return to Home'}
          </button>
        </div>
      </div>
    );
  }

  // Action Handlers
  const handleRoleChange = async (userId: string, newRole: 'tourist' | 'operator' | 'admin') => {
    try {
      await updateAdminUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setToast({ message: isKa ? 'როლი განახლდა' : 'User role updated', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleVerifyToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      await updateAdminUserVerify(userId, nextStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: nextStatus, verification_status: nextStatus ? 'verified' : 'rejected' } : u));
      setToast({ message: isKa ? 'ვერიფიკაციის სტატუსი შეიცვალა' : 'Verification status updated', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmModal({
      isOpen: true,
      title: isKa ? 'მომხმარებლის წაშლა' : 'Delete User',
      message: isKa ? `ნამდვილად გსურთ "${userName}"-ის წაშლა?` : `Are you sure you want to delete "${userName}"?`,
      onConfirm: async () => {
        try {
          await deleteAdminUser(userId);
          setUsers(prev => prev.filter(u => u.id !== userId));
          setToast({ message: isKa ? 'მომხმარებელი წაიშალა' : 'User deleted', type: 'success' });
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      }
    });
  };

  const handleTourStatusChange = async (tourId: number, status: string) => {
    try {
      await updateAdminTourStatus(tourId, status);
      setTours(prev => prev.map(t => t.id === tourId ? { ...t, status } : t));
      setToast({ message: isKa ? 'ტურის სტატუსი შეიცვალა' : 'Tour status updated', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteTour = (tourId: number, tourTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: isKa ? 'ტურის წაშლა' : 'Delete Tour',
      message: isKa ? `ნამდვილად გსურთ "${tourTitle}"-ის წაშლა?` : `Are you sure you want to delete tour "${tourTitle}"?`,
      onConfirm: async () => {
        try {
          await deleteAdminTour(tourId);
          setTours(prev => prev.filter(t => t.id !== tourId));
          setToast({ message: isKa ? 'ტური წაიშალა' : 'Tour deleted', type: 'success' });
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      }
    });
  };

  const handleDeleteReview = (reviewId: number) => {
    setConfirmModal({
      isOpen: true,
      title: isKa ? 'შეფასების წაშლა' : 'Delete Review',
      message: isKa ? 'ნამდვილად გსურთ ამ შეფასების წაშლა?' : 'Are you sure you want to delete this review?',
      onConfirm: async () => {
        try {
          await deleteAdminReview(reviewId);
          setReviews(prev => prev.filter(r => r.id !== reviewId));
          setToast({ message: isKa ? 'შეფასება წაიშალა' : 'Review deleted', type: 'success' });
        } catch (err: any) {
          setToast({ message: err.message, type: 'error' });
        }
      }
    });
  };

  // Filtered Lists
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.company_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredTours = tours.filter(t => {
    const matchesSearch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.profiles?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = tourStatusFilter === 'all' || t.status === tourStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReservations = reservations.filter(r => 
    (r.tourist_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.tourist_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.tour_title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviews.filter(r =>
    (r.comment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.profiles?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.tours?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                System Admin Panel
              </span>
              <span className="text-slate-400 text-xs font-medium">Supabase Operational Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
              {isKa ? 'ადმინისტრატორის მართვის პანელი' : 'Administrator Control Panel'}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              {isKa ? 'მართეთ საიტის მომხმარებლები, ტურები, რეზერვაციები და შეფასებები რეალურ დროში.' : 'Manage site users, listings, reservations, and reviews in real-time across the network.'}
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
              {isKa ? 'განახლება' : 'Refresh Data'}
            </button>
          </div>

          {/* Background Glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'overview', icon: 'dashboard', labelKa: 'მიმოხილვა', labelEn: 'Overview' },
            { id: 'users', icon: 'group', labelKa: `მომხმარებლები (${users.length})`, labelEn: `Users (${users.length})` },
            { id: 'tours', icon: 'tour', labelKa: `ტურები (${tours.length})`, labelEn: `Tours (${tours.length})` },
            { id: 'reservations', icon: 'event_note', labelKa: `რეზერვაციები (${reservations.length})`, labelEn: `Reservations (${reservations.length})` },
            { id: 'reviews', icon: 'rate_review', labelKa: `შეფასებები (${reviews.length})`, labelEn: `Reviews (${reviews.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
              className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {isKa ? tab.labelKa : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { titleKa: 'სულ მომხმარებელი', titleEn: 'Total Users', val: stats.totalUsers, sub: `${stats.operators} ${isKa ? 'ოპერატორი' : 'operators'}`, icon: 'person', color: 'from-blue-500/20 to-blue-900/10 border-blue-500/30 text-blue-400' },
                { titleKa: 'სულ ტური', titleEn: 'Total Listings', val: stats.totalTours, sub: `${stats.activeTours} ${isKa ? 'აქტიური' : 'published'}`, icon: 'map', color: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30 text-emerald-400' },
                { titleKa: 'სულ რეზერვაცია', titleEn: 'Total Reservations', val: stats.totalReservations, sub: isKa ? 'ყველა ოპერატორზე' : 'across all tours', icon: 'book_online', color: 'from-amber-500/20 to-amber-900/10 border-amber-500/30 text-amber-400' },
                { titleKa: 'სულ შეფასება', titleEn: 'Total Reviews', val: stats.totalReviews, sub: isKa ? 'მომხმარებლებისგან' : 'from travelers', icon: 'star', color: 'from-purple-500/20 to-purple-900/10 border-purple-500/30 text-purple-400' },
              ].map((card, i) => (
                <div key={i} className={`bg-gradient-to-br ${card.color} border p-6 rounded-3xl relative overflow-hidden shadow-xl`}>
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{isKa ? card.titleKa : card.titleEn}</p>
                    <div className="w-10 h-10 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-center">
                      <span className={`material-symbols-outlined ${card.color.split(' ').pop()}`}>{card.icon}</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white font-display mb-1">{card.val}</h3>
                  <p className="text-xs text-slate-400 font-medium">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick Summary Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400">group</span>
                    {isKa ? 'ბოლო რეგისტრირებული მომხმარებლები' : 'Recent Registrations'}
                  </h3>
                  <button onClick={() => setActiveTab('users')} className="text-xs font-bold text-emerald-400 hover:underline">
                    {isKa ? 'ყველას ნახვა' : 'View All'}
                  </button>
                </div>
                <div className="space-y-3">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                          {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            {u.name || 'Unnamed'}
                            {u.is_verified && <span className="material-symbols-outlined text-emerald-400 text-[14px]">verified</span>}
                          </p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        u.role === 'operator' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Tours */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400">tour</span>
                    {isKa ? 'ახალი დამატებული ტურები' : 'Latest Uploaded Tours'}
                  </h3>
                  <button onClick={() => setActiveTab('tours')} className="text-xs font-bold text-emerald-400 hover:underline">
                    {isKa ? 'ყველას ნახვა' : 'View All'}
                  </button>
                </div>
                <div className="space-y-3">
                  {tours.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-10 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                          <img src={t.image} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{t.title}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {t.location} • {t.profiles?.name || 'Operator'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg border ${
                        t.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Bar (for tabular views) */}
        {activeTab !== 'overview' && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isKa ? 'ძიება...' : 'Search records...'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 text-xs font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {activeTab === 'users' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isKa ? 'როლი:' : 'Role:'}</span>
                <select
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value)}
                  className="bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:border-emerald-500 outline-none"
                >
                  <option value="all">{isKa ? 'ყველა' : 'All Roles'}</option>
                  <option value="tourist">{isKa ? 'ტურისტი' : 'Tourist'}</option>
                  <option value="operator">{isKa ? 'ოპერატორი' : 'Operator'}</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {activeTab === 'tours' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isKa ? 'სტატუსი:' : 'Status:'}</span>
                <select
                  value={tourStatusFilter}
                  onChange={e => setTourStatusFilter(e.target.value)}
                  className="bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium focus:border-emerald-500 outline-none"
                >
                  <option value="all">{isKa ? 'ყველა' : 'All Statuses'}</option>
                  <option value="published">{isKa ? 'გამოქვეყნებული' : 'Published'}</option>
                  <option value="paused">{isKa ? 'შეჩერებული' : 'Paused'}</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Company</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Verified</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                        {isKa ? 'მომხმარებელი არ მოიძებნა' : 'No users match your criteria'}
                      </td>
                    </tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-300 shrink-0">
                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-extrabold text-white text-sm flex items-center gap-1.5">
                              {u.name || 'Unnamed'}
                              {u.is_verified && <span className="material-symbols-outlined text-emerald-400 text-[15px]">verified</span>}
                            </p>
                            <p className="text-slate-400 text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {u.company_name || <span className="text-slate-600">—</span>}
                      </td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value as any)}
                          className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:border-emerald-500 outline-none"
                        >
                          <option value="tourist">Tourist</option>
                          <option value="operator">Operator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleVerifyToggle(u.id, !!u.is_verified)}
                          className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 border transition-all ${
                            u.is_verified 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {u.is_verified ? 'verified' : 'unpublished'}
                          </span>
                          {u.is_verified ? (isKa ? 'ვერიფიცირებული' : 'Verified') : (isKa ? 'არა' : 'Unverified')}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          title={isKa ? 'წაშლა' : 'Delete'}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Tours Management */}
        {activeTab === 'tours' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="p-4">Tour Title</th>
                    <th className="p-4">Operator</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredTours.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                        {isKa ? 'ტური არ მოიძებნა' : 'No tours match your search'}
                      </td>
                    </tr>
                  ) : filteredTours.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                            <img src={t.image} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-extrabold text-white text-sm leading-snug">{t.title}</p>
                            <p className="text-slate-400 text-[11px] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">location_on</span>
                              {t.location} • {t.duration}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        <p className="font-bold text-white">{t.profiles?.name || 'Operator'}</p>
                        <p className="text-[11px] text-slate-400">{t.profiles?.email}</p>
                      </td>
                      <td className="p-4 font-black text-emerald-400 text-sm">
                        ₾{t.price}
                      </td>
                      <td className="p-4">
                        <select
                          value={t.status || 'published'}
                          onChange={e => handleTourStatusChange(t.id, e.target.value)}
                          className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:border-emerald-500 outline-none"
                        >
                          <option value="published">Published</option>
                          <option value="paused">Paused</option>
                          <option value="expired">Expired</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onNavigate('tour-detail', t)}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors"
                            title={isKa ? 'ნახვა' : 'View'}
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTour(t.id, t.title)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                            title={isKa ? 'წაშლა' : 'Delete'}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Reservations */}
        {activeTab === 'reservations' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="p-4">Tourist</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Tour Booked</th>
                    <th className="p-4">Travel Date</th>
                    <th className="p-4">Guests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                        {isKa ? 'რეზერვაციები არ მოიძებნა' : 'No reservations recorded'}
                      </td>
                    </tr>
                  ) : filteredReservations.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <p className="font-extrabold text-white text-sm">{r.tourist_name} {r.tourist_surname || ''}</p>
                        <span className="text-[10px] text-slate-500 uppercase">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-300 font-bold">{r.tourist_phone}</p>
                        <p className="text-[11px] text-slate-400">{r.tourist_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-emerald-400">{r.tour_title || r.tours?.title}</p>
                        <p className="text-[11px] text-slate-400">{r.tour_location}</p>
                      </td>
                      <td className="p-4 text-slate-300 font-bold">
                        {r.start_date} ({r.duration_days || 1} {isKa ? 'დღე' : 'days'})
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg font-bold">
                          {r.guests || 1} {isKa ? 'ადამიანი' : 'guests'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Reviews */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReviews.length === 0 ? (
              <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 font-bold">
                {isKa ? 'შეფასებები არ მოიძებნა' : 'No reviews match search'}
              </div>
            ) : filteredReviews.map(r => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 relative group hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-300">
                      {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} className="w-full h-full object-cover" /> : r.profiles?.name?.[0] || 'G'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{r.profiles?.name || 'Guest User'}</h4>
                      <p className="text-[11px] text-slate-400">{r.tours?.title || 'Unknown Tour'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-400 font-black text-xs">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      {r.rating}
                    </div>
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={isKa ? 'წაშლა' : 'Delete'}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 italic">
                  "{r.comment}"
                </p>

                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-right">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-white">{confirmModal.title}</h3>
            <p className="text-slate-300 text-xs font-medium">{confirmModal.message}</p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                {isKa ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/30 transition-all"
              >
                {isKa ? 'დადასტურება' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
