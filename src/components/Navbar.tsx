import React, { useState, useEffect } from 'react';
import { translations, Language } from '../translations';
import { User, getUnreadReservationCount } from '../api';
import { useWishlist } from '../hooks/useWishlist';
import { useCurrency } from '../hooks/useCurrency';
import { Heart } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string, data?: any) => void;
  currentPage: string;
  language: Language;
  setLanguage: (lang: Language) => void;
  user?: User | null;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

const whyGeorgiaItems = [
  {
    img: 'https://storage.georgia.travel/images/445x420/nature-of-georgia.webp',
    titleKa: 'საქართველოს ბუნება',
    titleEn: 'Georgian Nature',
    descKa: 'მთების, ხეობების და ტბების თვალწარმტაცი სილამაზე',
    descEn: 'Breathtaking mountains, valleys, and crystal lakes',
  },
  {
    img: 'https://storage.georgia.travel/images/445x420/food-and-wine-georgia.webp',
    titleKa: 'ღვინო და სამზარეულო',
    titleEn: 'Wine & Cuisine',
    descKa: '8000 წლის მეღვინეობის ტრადიცია და უგემრიელესი კერძები',
    descEn: '8,000 years of winemaking tradition & unforgettable dishes',
  },
  {
    img: 'https://storage.georgia.travel/images/445x420/arts-and-culture-in-georgia.webp',
    titleKa: 'კულტურა და ხელოვნება',
    titleEn: 'Culture & Arts',
    descKa: 'უნიკალური ანბანი, პოლიფონიური სიმღერა, ცეკვა',
    descEn: 'Unique alphabet, polyphonic singing, traditional dance',
  },
  {
    img: 'https://storage.georgia.travel/images/445x420/family-attractions-in-georgia.webp',
    titleKa: 'სტუმართმოყვარეობა',
    titleEn: 'Legendary Hospitality',
    descKa: 'სტუმარი ღვთის მოვლინებაა — ქართული სუფრა გელით',
    descEn: '"A guest is a gift from God" — Georgian Supra awaits',
  },
];

const placesItems = [
  {
    img: 'https://storage.georgia.travel/images/470x295/tbs.webp',
    titleKa: 'თბილისი',
    titleEn: 'Tbilisi',
    descKa: 'დედაქალაქი — ძველი ქალაქი, აბანოთუბანი, ნარიყალა',
    descEn: 'The capital — Old Town, sulfur baths, Narikala Fortress',
  },
  {
    img: 'https://storage.georgia.travel/images/445x420/mestia-gnta.webp',
    titleKa: 'სვანეთი',
    titleEn: 'Svaneti',
    descKa: 'შუასაუკუნეების კოშკები, უშგული, ჩალადი მყინვარი',
    descEn: 'Medieval towers, Ushguli village, Chalaadi Glacier',
  },
  {
    img: 'https://storage.georgia.travel/images/445x420/gudauri.webp',
    titleKa: 'ყაზბეგი',
    titleEn: 'Kazbegi',
    descKa: 'კავკასიონის მთები, გერგეტის სამება, თრუსოს ხეობა',
    descEn: 'Caucasus peaks, Gergeti Trinity, Truso Valley',
  },
  {
    img: 'https://storage.georgia.travel/images/445x420/bakhmaro-gnta.webp',
    titleKa: 'ბათუმი და აჭარა',
    titleEn: 'Batumi & Adjara',
    descKa: 'შავი ზღვის სანაპირო, ბოტანიკური ბაღი, ბულვარი',
    descEn: 'Black Sea coast, Botanical Garden, seaside boulevard',
  },
];




export default function Navbar({ onNavigate, currentPage, language, setLanguage, user, onLoginClick, onLogout }: NavbarProps) {
  const t = translations[language];
  const isKa = language === 'ka';
  const { wishlist } = useWishlist();
  // const { currency, setCurrency, convertPrice, getCurrencySymbol } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
  const [unreadReservations, setUnreadReservations] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for navbar background change
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unread reservations count for operators
  useEffect(() => {
    if (user?.role === 'operator') {
      const fetchCount = async () => setUnreadReservations(await getUnreadReservationCount(user.id));
      fetchCount();
      // Poll every 3 seconds to update the badge across tabs/components
      const interval = setInterval(fetchCount, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setMobileMenuClosing(false);
    }, 250);
  };

  const handleMobileNav = (page: string) => {
    closeMobileMenu();
    setTimeout(() => onNavigate(page), 100);
  };

  return (
    <>
    <header
      className={`sticky top-0 z-[1010] w-full transition-all duration-500 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-border-light shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          : 'bg-white/70 backdrop-blur-lg border-b border-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex h-[68px] items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => onNavigate('home')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-content shadow-md shadow-primary/15 transition-transform duration-300 hover:scale-105">
              <span className="material-symbols-outlined text-[20px] font-bold">terrain</span>
            </div>
            <span className="text-[19px] font-extrabold tracking-tight text-text-main font-display">
              {isKa ? 'მოგზაურობა' : 'Travel'}<span className="text-primary">{isKa ? 'საქართველოში' : 'Georgia'}</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Tours */}
            <button
              onClick={() => onNavigate('tours')}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 ${
                currentPage === 'tours'
                  ? 'text-primary bg-primary/5'
                  : 'text-text-main hover:text-primary hover:bg-gray-50'
              }`}
            >
              {t.nav_tours}
            </button>

            {/* Map Explorer */}
            <button
              onClick={() => onNavigate('map-explorer')}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                currentPage === 'map-explorer'
                  ? 'text-primary bg-primary/5'
                  : 'text-text-main hover:text-primary hover:bg-gray-50'
              }`}
            >
              {isKa ? 'ექსპლორერი' : 'Explorer'}
              <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-[9px] text-primary font-bold uppercase tracking-tight">{isKa ? 'ახალი' : 'New'}</span>
            </button>

            {/* Places with Dropdown */}
            <div className="group relative">
              <button
                onClick={() => onNavigate('places')}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-1 ${
                  currentPage === 'places'
                    ? 'text-primary bg-primary/5'
                    : 'text-text-main hover:text-primary hover:bg-gray-50'
                }`}
              >
                {t.nav_places}
                <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:rotate-180">expand_more</span>
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[680px] opacity-0 invisible translate-y-3 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50 pt-3">
                <div className="rounded-2xl bg-white shadow-xl shadow-black/5 border border-border-light overflow-hidden">
                  <div className="p-5 pb-3">
                    <p className="font-bold text-sm text-text-main mb-1">{isKa ? 'პოპულარული მიმართულებები' : 'Popular Destinations'}</p>
                    <p className="text-xs text-text-muted">{isKa ? 'საქართველოს საუკეთესო ადგილები ტურისტებისთვის' : 'The best places in Georgia for travelers'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
                    {placesItems.map((item, i) => (
                      <div key={i} className="relative overflow-hidden rounded-xl cursor-pointer group/card h-32 transition-transform duration-300 hover:scale-[1.02]">
                        <img
                          src={item.img}
                          alt={isKa ? item.titleKa : item.titleEn}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white">
                          <p className="font-bold text-[13px]">{isKa ? item.titleKa : item.titleEn}</p>
                          <p className="text-[11px] text-white/70 mt-0.5 line-clamp-1">{isKa ? item.descKa : item.descEn}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Favorites */}
            <button
              onClick={() => onNavigate('favorites')}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                currentPage === 'favorites'
                  ? 'text-primary bg-primary/5'
                  : 'text-text-muted hover:text-text-main hover:bg-gray-50'
              }`}
              title={isKa ? "რჩეულები" : "Favorites"}
            >
              <Heart size={18} className={currentPage === 'favorites' ? "fill-primary text-primary" : ""} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-content text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Notifications for operators */}
            {user?.role === 'operator' && (
              <button
                onClick={() => onNavigate('profile', { tab: 'reservations' })}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-gray-50 transition-all duration-300"
                title={isKa ? "რეზერვაციები" : "Reservations"}
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadReservations > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                    {unreadReservations}
                  </span>
                )}
              </button>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'ka' ? 'en' : 'ka')}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-semibold text-text-muted hover:text-text-main hover:bg-gray-50 transition-all duration-300"
            >
              <span className="material-symbols-outlined text-[18px]">language</span>
              {language === 'ka' ? 'EN' : 'GE'}
            </button>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                {user.role === 'operator' && (
                  <button
                    onClick={() => onNavigate('add-tour')}
                    className="h-9 px-4 bg-primary text-primary-content font-semibold text-[13px] rounded-xl shadow-sm shadow-primary/15 hover:shadow-md hover:shadow-primary/20 transition-all duration-300 flex items-center gap-1.5 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    {t.post_tour}
                  </button>
                )}
                <div className="group relative">
                  <div className="flex items-center gap-2 cursor-pointer py-1.5 px-2 hover:bg-gray-50 rounded-xl transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-[13px] uppercase">
                      {user.name[0]}
                    </div>
                    <span className="font-semibold text-[13px] text-text-main max-w-[100px] truncate">{user.name}</span>
                  </div>
                  <div className="absolute top-full right-0 pt-2 w-48 opacity-0 invisible translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50">
                    <div className="bg-white rounded-xl shadow-xl shadow-black/5 border border-border-light overflow-hidden flex flex-col">
                      <button onClick={() => onNavigate('profile')} className="w-full px-4 py-3 text-left text-[13px] font-semibold text-text-main hover:bg-gray-50 flex items-center gap-2.5 transition-colors border-b border-border-light">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        {isKa ? 'ჩემი პროფილი' : 'My Profile'}
                      </button>
                      <button onClick={onLogout} className="w-full px-4 py-3 text-left text-[13px] font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        {t.logout}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="hidden sm:inline-flex h-9 items-center justify-center rounded-xl bg-secondary px-5 text-[13px] font-semibold text-white transition-all duration-300 hover:bg-secondary/90 active:scale-95"
              >
                {t.login}
              </button>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-text-main hover:bg-gray-50 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* ═══════════════════════════════════════
          MOBILE DRAWER — rendered outside header to avoid stacking context issues
          ═══════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[2000] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={closeMobileMenu}
          />

          {/* Drawer Panel */}
          <div
            className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col ${
              mobileMenuClosing ? 'mobile-drawer-exit' : 'mobile-drawer-enter'
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-content">
                  <span className="material-symbols-outlined text-[18px] font-bold">terrain</span>
                </div>
                <span className="text-lg font-extrabold text-text-main font-display">{isKa ? 'მოგზაურობა' : 'Travel'}<span className="text-primary">{isKa ? 'საქართველოში' : 'Georgia'}</span></span>
              </div>
              <button
                onClick={closeMobileMenu}
                className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Drawer Body — scrollable */}
            <div className="flex-1 overflow-y-auto py-4">
              {/* Navigation Links */}
              <nav className="px-4 space-y-1">
                {[
                  { page: 'tours', label: t.nav_tours, icon: 'explore' },
                  { page: 'map-explorer', label: isKa ? 'ექსპლორერი' : 'Explorer', icon: 'map' },
                  { page: 'places', label: t.nav_places, icon: 'place' },
                  { page: 'favorites', label: isKa ? 'რჩეულები' : 'Favorites', icon: 'favorite' },
                ].map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleMobileNav(item.page)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-semibold text-sm transition-all duration-300 ${
                      currentPage === item.page
                        ? 'bg-primary/5 text-primary'
                        : 'text-text-main hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    {item.label}
                    {item.page === 'favorites' && wishlist.length > 0 && (
                      <span className="ml-auto bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {wishlist.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Divider */}
              <div className="mx-4 my-4 border-t border-border-light" />

              {/* Settings Row */}
              <div className="px-4 space-y-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-4">{isKa ? 'პარამეტრები' : 'Settings'}</p>

                {/* Language Toggle */}
                <button
                  onClick={() => setLanguage(language === 'ka' ? 'en' : 'ka')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-semibold text-sm text-text-main hover:bg-gray-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">language</span>
                  {isKa ? 'English' : 'ქართული'}
                  <span className="ml-auto text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                    {language === 'ka' ? 'EN' : 'GE'}
                  </span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-4 py-4 border-t border-border-light space-y-3">
              {user ? (
                <>
                  <button
                    onClick={() => handleMobileNav('profile')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                      {user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text-main truncate">{user.name}</p>
                      <p className="text-[10px] font-medium text-text-muted truncate">{user.email}</p>
                    </div>
                    <span className="material-symbols-outlined text-text-muted text-[18px]">chevron_right</span>
                  </button>
                  {user.role === 'operator' && (
                    <button
                      onClick={() => handleMobileNav('add-tour')}
                      className="w-full py-3 bg-primary text-white font-semibold rounded-xl shadow-sm shadow-primary/15 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      {t.post_tour}
                    </button>
                  )}
                  <button
                    onClick={() => { closeMobileMenu(); onLogout?.(); }}
                    className="w-full py-2.5 text-red-500 font-semibold text-sm rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    {t.logout}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { closeMobileMenu(); onLoginClick?.(); }}
                  className="w-full py-3.5 bg-secondary text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  {t.login}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
