import { useEffect, useState, useRef, useCallback, ReactNode, RefObject } from 'react';
import { translations, Language } from '../translations';
import SeasonModal from '../components/SeasonModal';
import TiltCard from '../components/TiltCard';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Compass, Satellite } from 'lucide-react';

/* ═══════════════════════════════════════
   DATA
   ═══════════════════════════════════════ */

const heroSlides = [
  {
    img: 'https://storage.georgia.travel/images/ushguli-gnta.webp',
    titleKa: 'საქართველო — აღმოაჩინე შენი თავგადასავალი',
    titleEn: 'Georgia — Discover Your Adventure',
    subtitleKa: 'უძველესი კულტურა, თვალისმომჭრელი ბუნება და დაუვიწყარი ემოციები',
    subtitleEn: 'Ancient culture, breathtaking nature, and unforgettable emotions',
  },
  {
    img: '/images/batumi-panorama.png',
    titleKa: 'შავი ზღვის მარგალიტი',
    titleEn: 'Pearl of the Black Sea',
    subtitleKa: 'თანამედროვე არქიტექტურა და ზღვისპირა დასვენება ბათუმში',
    subtitleEn: 'Modern architecture and seaside relaxation in Batumi',
  },
  {
    img: '/images/kazbegi-gnta.png',
    titleKa: 'მარადიული მწვერვალები',
    titleEn: 'Eternal Peaks',
    subtitleKa: 'ყაზბეგის დიდებული მთები და გერგეტის სამება',
    subtitleEn: 'The majestic mountains of Kazbegi and Gergeti Trinity',
  }
];

const popularSights = [
  { img: 'https://storage.georgia.travel/images/okatse-canyon-gnta.webp', titleKa: 'ოკაცეს კანიონი', titleEn: 'Okatse Canyon', catKa: 'ბუნების ძეგლი', catEn: 'Nature', placeId: 'imereti' },
  { img: 'https://storage.georgia.travel/images/abudelauri-lake-georgia.webp', titleKa: 'აბუდელაურის ფერადი ტბები', titleEn: 'Abudelauri Lakes', catKa: 'ბუნების ძეგლი', catEn: 'Nature', placeId: 'mountain' },
  { img: 'https://storage.georgia.travel/images/svetitskhoveli-cathedral-gnta.webp', titleKa: 'სვეტიცხოველი', titleEn: 'Svetitskhoveli', catKa: 'კულტურული ძეგლი', catEn: 'Cultural', placeId: 'mtskheta' },
  { img: 'https://storage.georgia.travel/images/vardzia-gnta.webp', titleKa: 'ვარძია', titleEn: 'Vardzia', catKa: 'კულტურული ძეგლი', catEn: 'Cultural', placeId: 'samtskhe' },
  { img: 'https://storage.georgia.travel/images/sataplia-cave-and-nature-reserve-gnta.webp', titleKa: 'სათაფლიის მღვიმე', titleEn: 'Sataplia Cave', catKa: 'ბუნების ძეგლი', catEn: 'Nature', placeId: 'imereti' },
  { img: 'https://storage.georgia.travel/images/gomi-mountain-gnta.webp', titleKa: 'გერგეტის სამება', titleEn: 'Gergeti Trinity', catKa: 'კულტურული ძეგლი', catEn: 'Cultural', placeId: 'kazbegi' },
];

const seasons = [
  { img: 'https://storage.georgia.travel/images/nature-of-georgia.webp', nameKa: 'გაზაფხული', nameEn: 'Spring', descKa: 'სიმწვანე ავსებს ველებს, ალპური ყვავილები იფურჩქნება და მთები ახალ სიცოცხლეს იძენს', descEn: 'Greenery fills the fields, alpine flowers bloom, and mountains come alive', icon: 'eco' },
  { img: 'https://storage.georgia.travel/images/bakhmaro-gnta.webp', nameKa: 'ზაფხული', nameEn: 'Summer', descKa: 'შავი ზღვის სანაპიროები, ალპური მდელოები და ყველაზე გრძელი დღეები მთებში', descEn: 'Black Sea beaches, alpine meadows, and the longest days in the mountains', icon: 'sunny' },
  { img: 'https://storage.georgia.travel/images/food-and-wine-georgia.webp', nameKa: 'შემოდგომა', nameEn: 'Autumn', descKa: 'რთველის სეზონი, ფერადი ტყეები და ქართული ღვინის საუკეთესო პერიოდი', descEn: 'Harvest season, colorful forests, and the best time for Georgian wine', icon: 'park' },
  { img: 'https://storage.georgia.travel/images/gudauri.webp', nameKa: 'ზამთარი', nameEn: 'Winter', descKa: 'სათხილამურო კურორტები, თოვლიანი მთები და ზამთრის ზღაპრული ლანდშაფტი', descEn: 'Ski resorts, snowy mountains, and a fairytale winter landscape', icon: 'ac_unit' },
];


/* ═══════════════════════════════════════
   SCROLL REVEAL WRAPPER
   ═══════════════════════════════════════ */

function ScrollReveal({ children, className = '', variant = 'up', delay = 0 }: {
  children: ReactNode;
  className?: string;
  variant?: 'up' | 'left' | 'scale';
  delay?: number;
}) {
  const { ref, isVisible } = useScrollReveal();
  const baseClass = variant === 'left' ? 'scroll-reveal-left' : variant === 'scale' ? 'scroll-reveal-scale' : 'scroll-reveal';

  return (
    <div
      ref={ref}
      className={`${baseClass} ${isVisible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════ */

export default function Home({ onNavigate, language }: { onNavigate: (page: string, data?: any) => void; language: Language }) {
  const t = translations[language];
  const isKa = language === 'ka';

  const [activeSlide, setActiveSlide] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);

  /* Slider interval */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
      setProgressKey((k) => k + 1);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  /* Parallax scroll listener — optimized for high FPS */
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY <= 900) {
            setScrollY(window.scrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goToSlide = (i: number) => {
    setActiveSlide(i);
    setProgressKey((k) => k + 1);
  };

  /* Carousel scroll helpers */
  const sightsRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((ref: RefObject<HTMLDivElement | null>, dir: number) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
  }, []);

  return (
    <>
      {/* Season Modal */}
      {selectedSeason && (
        <SeasonModal
          season={selectedSeason}
          language={language}
          onClose={() => setSelectedSeason(null)}
        />
      )}

      {/* ════════════════════════════════════
          SECTION 1 — HERO SLIDESHOW WITH PARALLAX
          ════════════════════════════════════ */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Slides */}
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.img}
              alt="Hero"
              loading={idx === 0 ? "eager" : "lazy"}
              className="absolute inset-0 w-full h-full object-cover will-change-transform"
              style={{
                transform: `translateY(${scrollY * 0.3}px) scale(${idx === activeSlide ? 1.05 : 1})`,
                transition: 'transform 0.1s linear',
              }}
            />
            {/* Dark gradient overlay — cinematic */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

            {/* Text Content */}
            {idx === activeSlide && (
              <div className="absolute inset-0 z-20 flex flex-col justify-end pb-32 sm:pb-36 px-6 sm:px-12 lg:px-24 max-w-5xl">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-2xl animate-fade-in-up font-display">
                  {isKa ? slide.titleKa : slide.titleEn}
                </h1>
                <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                  {isKa ? slide.subtitleKa : slide.subtitleEn}
                </p>
                <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <button
                    onClick={() => onNavigate('tours')}
                    className="px-8 py-4 rounded-full bg-primary text-primary-content font-bold text-[15px] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center gap-2"
                  >
                    {isKa ? 'ტურების ნახვა' : 'Browse Tours'}
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Slide Indicators — refined */}
        <div className="absolute bottom-14 left-6 sm:left-12 lg:left-24 z-30 flex gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`relative h-[3px] rounded-full overflow-hidden transition-all duration-500 ${
                idx === activeSlide ? 'w-12 bg-white/25' : 'w-5 bg-white/40 hover:bg-white/60'
              }`}
            >
              {idx === activeSlide && (
                <div
                  key={progressKey}
                  className="absolute top-0 left-0 h-full bg-white rounded-full"
                  style={{ animation: 'slideProgress 6s linear forwards' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Scroll indicator — minimal */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 animate-fade-in" style={{ animationDelay: '2s' }}>
          <span className="text-white/40 text-[10px] font-semibold tracking-[0.2em] uppercase">{isKa ? 'გადაახვიე' : 'Scroll'}</span>
          <div className="w-[18px] h-7 rounded-full border border-white/20 flex items-start justify-center p-1">
            <div className="w-[3px] h-1.5 bg-white/50 rounded-full" style={{ animation: 'fade-in-up 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>



      {/* ════════════════════════════════════
          SECTION 2 — MAP EXPLORER PROMO
          ════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ padding: 'clamp(4rem, 8vw, 7rem) 0' }}>
        {/* Background */}
        <div className="absolute inset-0 bg-[#0a0f1e]" />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
           <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_70%)] blur-[120px]" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2">
              <ScrollReveal variant="left">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-widest mb-5 border border-primary/15">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                  {isKa ? 'ახალი ტექნოლოგია' : 'New Technology'}
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6 font-display">
                   {isKa 
                    ? <>აღმოაჩინე საქართველო <span className="text-primary">კოსმოსიდან</span></>
                    : <>Discover Georgia from <span className="text-primary">Space</span></>}
                </h2>
                <p className="text-white/60 text-base sm:text-lg mb-8 leading-relaxed max-w-xl">
                  {isKa 
                    ? 'გაეცანი საქართველოს კულტურულ ძეგლებსა და ბუნებრივ საოცრებებს რეალისტური სატელიტური რუკის მეშვეობით. 3D რელიეფი და მაღალი ხარისხის გამოსახულება.'
                    : 'Explore Georgia\'s cultural landmarks and natural wonders through a realistic satellite map. High-resolution 3D terrain and interactive exploration.'}
                </p>
                <button 
                  onClick={() => onNavigate('map-explorer')}
                  className="px-8 py-4 bg-primary text-primary-content rounded-full font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center gap-2.5"
                >
                   {isKa ? 'გახსენი ექსპლორერი' : 'Open Geo-Explorer'}
                   <Compass size={20} />
                </button>
              </ScrollReveal>
            </div>
            <div className="lg:w-1/2 relative">
               <ScrollReveal variant="scale" delay={0.2}>
                 <div className="relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl shadow-black/40 aspect-square max-w-[480px] mx-auto group">
                    <img 
                      src="/images/georgia_satellite.png" 
                      alt="Explorer Preview" 
                      loading="lazy"
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[3000ms] ease-out" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-20 h-20 rounded-full bg-primary/15 backdrop-blur-xl border border-primary/25 flex items-center justify-center">
                          <Satellite size={40} className="text-primary" />
                       </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent" />
                 </div>
               </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          SECTION 3 — SEASONS
          ════════════════════════════════════ */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) 0' }} className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main leading-tight max-w-2xl font-display">
                {isKa
                  ? <>შენი <span className="text-primary">365 დღე</span> საქართველოში</>
                  : <>Your <span className="text-primary">365 Days</span> in Georgia</>}
              </h2>
              <p className="text-text-muted max-w-md text-sm leading-relaxed">
                {isKa
                  ? 'დააჭირე სეზონს და აღმოაჩინე ყველაზე პოპულარული კურორტი — თოვლიანი მთებიდან შავი ზღვის სანაპირომდე.'
                  : 'Click a season and discover the most popular resort — from snowy mountains to the Black Sea coast.'}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="scale">
            <div className="flex flex-col sm:flex-row gap-2.5 h-[400px] sm:h-[480px]">
              {seasons.map((s, i) => (
                <div
                  key={i}
                  className="season-panel relative rounded-[2rem] overflow-hidden group shadow-md"
                  onClick={() => setSelectedSeason(s.nameKa)}
                >
                  <img src={s.img} alt={isKa ? s.nameKa : s.nameEn} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  {/* Season icon */}
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-lg glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-1 group-hover:translate-y-0">
                    <span className="material-symbols-outlined text-white text-[16px]">{s.icon}</span>
                  </div>
                  <div className="absolute bottom-5 left-4 right-4 text-white z-10">
                    <h3 className="font-bold text-lg sm:text-xl font-display">{isKa ? s.nameKa : s.nameEn}</h3>
                    <div className="season-overlay mt-1.5">
                      <p className="text-sm text-white/80 leading-relaxed">{isKa ? s.descKa : s.descEn}</p>
                      <span className="inline-flex items-center gap-1 mt-2 text-primary text-[11px] font-semibold">
                        <span className="material-symbols-outlined text-[13px]">touch_app</span>
                        {isKa ? 'დააჭირე — ნახე პოპულარული კურორტი' : 'Click — see popular resort'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════
          SECTION 4 — POPULAR SIGHTS CAROUSEL
          ════════════════════════════════════ */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) 0' }} className="bg-background-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main leading-tight max-w-3xl mb-3 font-display">
              {isKa
                ? <>ეს <span className="text-primary">საქართველოა,</span> ქვეყანა, რომელიც დაუვიწყარ სანახაობებს გთავაზობს!</>
                : <>This is <span className="text-primary">Georgia,</span> a country offering unforgettable sights!</>}
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="flex items-center justify-between mt-10 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="text-primary text-base">✦</span>
                <span className="font-semibold text-text-main text-sm">{isKa ? 'აღმოაჩინე პოპულარული სანახაობები' : 'Discover popular sights'}</span>
              </div>
              <div className="hidden sm:flex gap-1.5">
                <button onClick={() => scroll(sightsRef, -1)} className="w-9 h-9 rounded-xl border border-border-light flex items-center justify-center hover:bg-primary hover:text-primary-content hover:border-primary transition-all duration-300">
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                </button>
                <button onClick={() => scroll(sightsRef, 1)} className="w-9 h-9 rounded-xl border border-border-light flex items-center justify-center hover:bg-primary hover:text-primary-content hover:border-primary transition-all duration-300">
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="scale">
            <div ref={sightsRef} className="carousel-scroll flex gap-4 overflow-x-auto pb-4">
              {popularSights.map((sight, i) => (
                <TiltCard key={i} className="flex-shrink-0 w-52 sm:w-60 rounded-2xl" maxTilt={4}>
                  <div 
                    className="relative h-68 sm:h-76 rounded-2xl overflow-hidden shadow-md group cursor-pointer"
                    onClick={() => onNavigate('places', { placeId: sight.placeId })}
                  >
                    <img src={sight.img} alt={isKa ? sight.titleKa : sight.titleEn} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    {/* Glassmorphism overlay on hover */}
                    <div className="absolute inset-0 sight-card-glass rounded-2xl" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="font-bold text-[15px] leading-tight font-display">{isKa ? sight.titleKa : sight.titleEn}</p>
                      <p className="text-[11px] text-white/65 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">{sight.catEn === 'Nature' ? 'eco' : 'church'}</span>
                        {isKa ? sight.catKa : sight.catEn}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>



    </>
  );
}
