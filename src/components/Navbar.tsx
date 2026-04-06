import React, { useState, useEffect } from 'react';
import { translations, Language } from '../translations';
import { User } from '../api';
import { useDarkMode } from '../hooks/useDarkMode';
import { useWishlist } from '../hooks/useWishlist';
import { useCurrency } from '../hooks/useCurrency';
import { Moon, Sun, Heart } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
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

const sightsItems = [
  {
    img: 'https://storage.georgia.travel/images/445x420/svetitskhoveli-cathedral-gnta.webp',
    titleKa: 'სვეტიცხოველი',
    titleEn: 'Svetitskhoveli',
    descKa: 'მცხეთის UNESCO-ს ძეგლი — საქართველოს სულიერი ცენტრი',
    descEn: 'UNESCO site in Mtskheta — Georgia\'s spiritual heart',
  },
  {
    img: 'https://storage.georgia.travel/images/445x420/vardzia-gnta.webp',
    titleKa: 'ვარძია',
    titleEn: 'Vardzia',
    descKa: 'XII საუკუნის გამოქვაბული ქალაქ-მონასტერი',
    descEn: '12th-century cave monastery carved into a cliff',
  },
  {
    img: 'https://storage.georgia.travel/images/300x400/okatse-canyon-gnta.webp',
    titleKa: 'ოკაცეს კანიონი',
    titleEn: 'Okatse Canyon',
    descKa: 'თვალწარმტაცი კანიონი და გამჭვირვალე ხიდი',
    descEn: 'Stunning canyon with a transparent hanging walkway',
  },
  {
    img: 'https://storage.georgia.travel/images/445x420/abudelauri-lake-georgia.webp',
    titleKa: 'აბუდელაურის ტბები',
    titleEn: 'Abudelauri Lakes',
    descKa: 'სამი ფერადი ალპური ტბა კავკასიონის გულში',
    descEn: 'Three colorful alpine lakes in the heart of the Caucasus',
  },
];


export default function Navbar({ onNavigate, currentPage, language, setLanguage, user, onLoginClick, onLogout }: NavbarProps) {
  const t = translations[language];
  const isKa = language === 'ka';
  const { isDark, toggleDarkMode } = useDarkMode();
  const { wishlist } = useWishlist();
  const { currency, setCurrency, convertPrice, getCurrencySymbol } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);

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
    <header className="sticky top-0 z-50 w-full border-b border-border-light bg-surface-light/95 backdrop-blur supports-[backdrop-filter]:bg-surface-light/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-content shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
              <span className="material-symbols-outlined font-bold">terrain</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-text-main">Travel<span className="text-primary">Georgia</span></span>
          </div>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {/* ========== Tours ========== */}
            <div className="group relative">
              <button onClick={() => onNavigate('tours')} className={`flex items-center gap-1 text-sm font-bold transition-colors py-4 ${currentPage === 'tours' ? 'text-primary' : 'text-text-main group-hover:text-primary'}`}>
                {t.nav_tours}
              </button>
            </div>

            {/* ========== Why Georgia ========== */}
            <div className="group relative">
              <button onClick={() => onNavigate('why-georgia')} className={`flex items-center gap-1 text-sm font-bold transition-colors py-4 ${currentPage === 'why-georgia' ? 'text-primary' : 'text-text-main group-hover:text-primary'}`}>
                {t.nav_why_georgia}
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:rotate-180">expand_more</span>
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[700px] opacity-0 invisible translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50 pt-1">
                <div className="rounded-2xl bg-surface-light shadow-2xl border border-border-light overflow-hidden">
                  {/* Hero banner */}
                  <div className="relative h-40 w-full overflow-hidden">
                    <img
                      src="https://storage.georgia.travel/images/445x420/why-georgia-nature.webp"
                      alt="Why Georgia"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-5 text-white">
                      <p className="font-extrabold text-xl">{t.nav_why_georgia}</p>
                      <p className="text-sm text-white/80 mt-0.5">
                        {isKa ? 'აღმოაჩინე რატომ უყვართ ტურისტებს საქართველო' : 'Discover why tourists fall in love with Georgia'}
                      </p>
                    </div>
                  </div>

                  {/* Grid items */}
                  <div className="grid grid-cols-2 gap-3 p-4">
                    {whyGeorgiaItems.map((item, i) => (
                      <div key={i} className="flex gap-3 p-2.5 rounded-xl hover:bg-background-light transition-colors cursor-pointer group/item">
                        <img
                          src={item.img}
                          alt={isKa ? item.titleKa : item.titleEn}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 transition-transform duration-300 group-hover/item:scale-105"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-text-main leading-tight">{isKa ? item.titleKa : item.titleEn}</p>
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{isKa ? item.descKa : item.descEn}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ========== Places ========== */}
            <div className="group relative">
              <button onClick={() => onNavigate('places')} className={`flex items-center gap-1 text-sm font-bold transition-colors py-4 ${currentPage === 'places' ? 'text-primary' : 'text-text-main group-hover:text-primary'}`}>
                {t.nav_places}
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:rotate-180">expand_more</span>
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[700px] opacity-0 invisible translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50 pt-1">
                <div className="rounded-2xl bg-surface-light shadow-2xl border border-border-light overflow-hidden">
                  <div className="p-4">
                    <p className="font-extrabold text-base text-text-main mb-1">{isKa ? 'პოპულარული მიმართულებები' : 'Popular Destinations'}</p>
                    <p className="text-xs text-text-muted mb-3">{isKa ? 'საქართველოს საუკეთესო ადგილები ტურისტებისთვის' : 'The best places in Georgia for travelers'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                    {placesItems.map((item, i) => (
                      <div key={i} className="relative overflow-hidden rounded-xl cursor-pointer group/card h-36">
                        <img
                          src={item.img}
                          alt={isKa ? item.titleKa : item.titleEn}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-white">
                          <p className="font-bold text-sm">{isKa ? item.titleKa : item.titleEn}</p>
                          <p className="text-[11px] text-white/75 mt-0.5 line-clamp-1">{isKa ? item.descKa : item.descEn}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ========== Sights ========== */}
            <div className="group relative">
              <button onClick={() => onNavigate('sights')} className={`flex items-center gap-1 text-sm font-bold transition-colors py-4 ${currentPage === 'sights' ? 'text-primary' : 'text-text-main group-hover:text-primary'}`}>
                {t.nav_sights}
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:rotate-180">expand_more</span>
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[700px] opacity-0 invisible translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50 pt-1">
                <div className="rounded-2xl bg-surface-light shadow-2xl border border-border-light overflow-hidden">
                  <div className="p-4">
                    <p className="font-extrabold text-base text-text-main mb-1">{isKa ? 'აუცილებელი სანახაობები' : 'Must-See Sights'}</p>
                    <p className="text-xs text-text-muted mb-3">{isKa ? 'საქართველოს ყველაზე შთამბეჭდავი ადგილები' : 'Georgia\'s most impressive landmarks'}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3 px-4 pb-4">
                    {sightsItems.map((item, i) => (
                      <div key={i} className="relative overflow-hidden rounded-xl cursor-pointer group/card h-44">
                        <img
                          src={item.img}
                          alt={isKa ? item.titleKa : item.titleEn}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 text-white">
                          <p className="font-bold text-xs leading-tight">{isKa ? item.titleKa : item.titleEn}</p>
                          <p className="text-[10px] text-white/70 mt-0.5 line-clamp-2">{isKa ? item.descKa : item.descEn}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button className="text-sm font-bold text-text-main hover:text-primary transition-colors py-4">{t.contact}</button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('favorites')}
              className={`relative p-2 rounded-full hover:bg-background-light transition-colors flex items-center justify-center border border-border-light sm:border-transparent ${currentPage === 'favorites' ? 'text-primary' : 'text-text-main'}`}
              title={isKa ? "რჩეულები" : "Favorites"}
            >
              <Heart size={20} className={currentPage === 'favorites' ? "fill-primary text-primary" : ""} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-primary text-primary-content text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-background-light transition-colors text-text-main flex items-center justify-center border border-border-light sm:border-transparent"
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {/* Language & Currency — hidden on small mobile, visible in drawer instead */}
            <button
              onClick={() => setLanguage(language === 'ka' ? 'en' : 'ka')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-light hover:bg-background-light transition-colors text-sm font-bold text-text-main"
            >
              <span className="material-symbols-outlined text-lg">language</span>
              {language === 'ka' ? 'EN' : 'GE'}
            </button>
            <div className="relative hidden sm:block">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="appearance-none bg-transparent pl-3 pr-8 py-1.5 rounded-lg border border-border-light hover:bg-background-light transition-colors text-sm font-bold text-text-main outline-none cursor-pointer"
              >
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GEL">₾ GEL</option>
              </select>
              <span className="material-symbols-outlined text-lg absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">expand_more</span>
            </div>

            {user ? (
              <div className="hidden sm:flex items-center gap-4">
                {user.role === 'operator' && (
                  <button
                    onClick={() => onNavigate('add-tour')}
                    className="h-10 px-5 bg-primary text-primary-content font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px] font-bold">add_circle</span>
                    {t.post_tour}
                  </button>
                )}
                <div className="group relative">
                  <div className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-background-light rounded-xl transition-colors border border-transparent hover:border-border-light">
                    <div className="w-8 h-8 rounded-full bg-surface-dark text-white flex items-center justify-center font-black text-sm uppercase">
                      {user.name[0]}
                    </div>
                    <span className="font-bold text-sm text-text-main max-w-[100px] truncate">{user.name}</span>
                  </div>
                  <div className="absolute top-full right-0 pt-2 w-48 opacity-0 invisible translate-y-2 transition-all group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-border-light overflow-hidden flex flex-col">
                      <button onClick={() => onNavigate('profile')} className="w-full px-4 py-3 text-left text-sm font-bold text-text-main hover:bg-background-light flex items-center gap-2 transition-colors border-b border-border-light">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                        {isKa ? 'ჩემი პროფილი' : 'My Profile'}
                      </button>
                      <button onClick={onLogout} className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
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
                className="hidden sm:inline-flex h-10 items-center justify-center rounded-xl bg-text-main px-6 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all hover:bg-text-main/90 active:scale-95"
              >
                {t.login}
              </button>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden text-text-main p-1"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* ═══════════════════════════════════════
          MOBILE DRAWER — rendered outside header to avoid stacking context issues
          ═══════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={closeMobileMenu}
          />

          {/* Drawer Panel */}
          <div
            className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-surface-light shadow-2xl flex flex-col ${
              mobileMenuClosing ? 'mobile-drawer-exit' : 'mobile-drawer-enter'
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-content">
                  <span className="material-symbols-outlined text-[18px] font-bold">terrain</span>
                </div>
                <span className="text-lg font-extrabold text-text-main">Travel<span className="text-primary">Georgia</span></span>
              </div>
              <button
                onClick={closeMobileMenu}
                className="w-9 h-9 rounded-full bg-background-light flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Body — scrollable */}
            <div className="flex-1 overflow-y-auto py-4">
              {/* Navigation Links */}
              <nav className="px-4 space-y-1">
                {[
                  { page: 'tours', label: t.nav_tours, icon: 'explore' },
                  { page: 'why-georgia', label: t.nav_why_georgia, icon: 'auto_awesome' },
                  { page: 'places', label: t.nav_places, icon: 'place' },
                  { page: 'sights', label: t.nav_sights, icon: 'photo_camera' },
                  { page: 'favorites', label: isKa ? 'რჩეულები' : 'Favorites', icon: 'favorite' },
                ].map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleMobileNav(item.page)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-bold text-sm transition-all ${
                      currentPage === item.page
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-main hover:bg-background-light'
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
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest px-4">{isKa ? 'პარამეტრები' : 'Settings'}</p>

                {/* Language Toggle */}
                <button
                  onClick={() => setLanguage(language === 'ka' ? 'en' : 'ka')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-bold text-sm text-text-main hover:bg-background-light transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">language</span>
                  {isKa ? 'English' : 'ქართული'}
                  <span className="ml-auto text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {language === 'ka' ? 'EN' : 'GE'}
                  </span>
                </button>

                {/* Currency Selector */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-left font-bold text-sm text-text-main">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                  {isKa ? 'ვალუტა' : 'Currency'}
                  <div className="ml-auto flex gap-1">
                    {(['USD', 'EUR', 'GEL'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                          currency === c
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-background-light text-text-muted hover:text-text-main'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-bold text-sm text-text-main hover:bg-background-light transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
                  {isDark ? (isKa ? 'ნათელი რეჟიმი' : 'Light Mode') : (isKa ? 'მუქი რეჟიმი' : 'Dark Mode')}
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-4 py-4 border-t border-border-light space-y-3">
              {user ? (
                <>
                  <button
                    onClick={() => handleMobileNav('profile')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-background-light text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-dark text-white flex items-center justify-center font-black text-sm uppercase flex-shrink-0">
                      {user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-text-main truncate">{user.name}</p>
                      <p className="text-[10px] font-bold text-text-muted truncate">{user.email}</p>
                    </div>
                    <span className="material-symbols-outlined text-text-muted text-[18px]">chevron_right</span>
                  </button>
                  {user.role === 'operator' && (
                    <button
                      onClick={() => handleMobileNav('add-tour')}
                      className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      {t.post_tour}
                    </button>
                  )}
                  <button
                    onClick={() => { closeMobileMenu(); onLogout?.(); }}
                    className="w-full py-2.5 text-red-500 font-bold text-sm rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    {t.logout}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { closeMobileMenu(); onLoginClick?.(); }}
                  className="w-full py-3.5 bg-text-main text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
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
