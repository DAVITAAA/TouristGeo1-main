import { useEffect, useState, useRef, useCallback, ReactNode, RefObject } from 'react';
import { translations, Language } from '../translations';
import SeasonModal from '../components/SeasonModal';
import TiltCard from '../components/TiltCard';
import FAQ from '../components/FAQ';
import { useScrollReveal } from '../hooks/useScrollReveal';

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
  { img: 'https://storage.georgia.travel/images/okatse-canyon-gnta.webp', titleKa: 'ოკაცეს კანიონი', titleEn: 'Okatse Canyon', catKa: 'ბუნების ძეგლი', catEn: 'Nature' },
  { img: 'https://storage.georgia.travel/images/abudelauri-lake-georgia.webp', titleKa: 'აბუდელაურის ფერადი ტბები', titleEn: 'Abudelauri Lakes', catKa: 'ბუნების ძეგლი', catEn: 'Nature' },
  { img: 'https://storage.georgia.travel/images/svetitskhoveli-cathedral-gnta.webp', titleKa: 'სვეტიცხოველი', titleEn: 'Svetitskhoveli', catKa: 'კულტურული ძეგლი', catEn: 'Cultural' },
  { img: 'https://storage.georgia.travel/images/vardzia-gnta.webp', titleKa: 'ვარძია', titleEn: 'Vardzia', catKa: 'კულტურული ძეგლი', catEn: 'Cultural' },
  { img: 'https://storage.georgia.travel/images/sataplia-cave-and-nature-reserve-gnta.webp', titleKa: 'სათაფლიის მღვიმე', titleEn: 'Sataplia Cave', catKa: 'ბუნების ძეგლი', catEn: 'Nature' },
  { img: 'https://storage.georgia.travel/images/gomi-mountain-gnta.webp', titleKa: 'გერგეტის სამება', titleEn: 'Gergeti Trinity', catKa: 'კულტურული ძეგლი', catEn: 'Cultural' },
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
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  /* Parallax scroll listener */
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
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
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
          >
            <img
              src={slide.img}
              alt="Hero"
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-linear"
              style={{
                transform: `translateY(${scrollY * 0.4}px) scale(${idx === activeSlide ? 1.05 : 1})`,
              }}
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

            {/* Text Content */}
            {idx === activeSlide && (
              <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 lg:px-24 max-w-5xl">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-2xl animate-fade-in-up">
                  {isKa ? slide.titleKa : slide.titleEn}
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-2xl font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  {isKa ? slide.subtitleKa : slide.subtitleEn}
                </p>
                <div className="mt-10 flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <button onClick={() => onNavigate('tours')} className="pulse-cta px-8 py-4 rounded-xl bg-primary text-primary-content font-black text-base shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2">
                    {isKa ? 'ტურების ნახვა' : 'Browse Tours'}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                  <button onClick={() => onNavigate('why-georgia')} className="px-8 py-4 rounded-xl border-2 border-white/40 text-white font-black text-base hover:bg-white/10 backdrop-blur-sm transition-all flex items-center gap-2 hover:border-white/70">
                    {isKa ? 'გაიგე მეტი' : 'Learn More'}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {/* Slide Indicators */}
        <div className="absolute bottom-12 left-6 sm:left-12 lg:left-24 z-30 flex gap-3">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 ${idx === activeSlide ? 'w-10 bg-white/30' : 'w-6 bg-white/50 hover:bg-white/70'
                }`}
            >
              {idx === activeSlide && (
                <div
                  key={progressKey}
                  className="absolute top-0 left-0 h-full bg-white animate-slide-progress"
                  style={{ animation: 'slideProgress 5s linear forwards' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: '1.5s' }}>
          <span className="text-white/50 text-xs font-bold tracking-widest uppercase">{isKa ? 'გადაახვიე' : 'Scroll'}</span>
          <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/60 rounded-full" style={{ animation: 'fade-in-up 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </section>



      {/* ════════════════════════════════════
          SECTION 3 — FOUR SEASONS
          ════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-main leading-tight max-w-2xl">
                {isKa
                  ? <>შენი <span className="text-primary">365 დღე</span> საქართველოში</>
                  : <>Your <span className="text-primary">365 Days</span> in Georgia</>}
              </h2>
              <p className="text-text-muted max-w-md text-base">
                {isKa
                  ? 'დააჭირე სეზონს და აღმოაჩინე ყველაზე პოპულარული კურორტი — თოვლიანი მთებიდან შავი ზღვის სანაპირომდე.'
                  : 'Click a season and discover the most popular resort — from snowy mountains to the Black Sea coast.'}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="scale">
            <div className="flex flex-col sm:flex-row gap-3 h-[420px] sm:h-[500px]">
              {seasons.map((s, i) => (
                <div
                  key={i}
                  className="season-panel relative rounded-2xl sm:rounded-3xl overflow-hidden group"
                  onClick={() => setSelectedSeason(s.nameKa)}
                >
                  <img src={s.img} alt={isKa ? s.nameKa : s.nameEn} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Glassmorphism season icon */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-xl glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <span className="material-symbols-outlined text-white text-lg">{s.icon}</span>
                  </div>
                  <div className="absolute bottom-6 left-5 right-5 text-white z-10">
                    <h3 className="font-black text-xl sm:text-2xl">{isKa ? s.nameKa : s.nameEn}</h3>
                    <div className="season-overlay mt-2">
                      <p className="text-sm text-white/85 leading-relaxed">{isKa ? s.descKa : s.descEn}</p>
                      <span className="inline-flex items-center gap-1 mt-2 text-primary text-xs font-bold">
                        <span className="material-symbols-outlined text-sm">touch_app</span>
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
          SECTION 5 — POPULAR SIGHTS CAROUSEL
          ════════════════════════════════════ */}
      <section className="py-24 bg-background-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-main leading-tight max-w-3xl mb-4">
              {isKa
                ? <>ეს <span className="text-primary">საქართველოა,</span> ქვეყანა, რომელიც დაუვიწყარ სანახაობებს გთავაზობს!</>
                : <>This is <span className="text-primary">Georgia,</span> a country offering unforgettable sights!</>}
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="flex items-center justify-between mt-12 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-primary text-xl">✦</span>
                <span className="font-bold text-text-main">{isKa ? 'აღმოაჩინე პოპულარული სანახაობები' : 'Discover popular sights'}</span>
                <button onClick={() => onNavigate('sights')} className="text-primary font-bold text-sm hover:underline ml-4">
                  {isKa ? 'ყველას ნახვა' : 'View all'}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scroll(sightsRef, -1)} className="w-10 h-10 rounded-full border border-border-light flex items-center justify-center hover:bg-primary hover:text-primary-content hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button onClick={() => scroll(sightsRef, 1)} className="w-10 h-10 rounded-full border border-border-light flex items-center justify-center hover:bg-primary hover:text-primary-content hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="scale">
            <div ref={sightsRef} className="carousel-scroll flex gap-5 overflow-x-auto pb-4">
              {popularSights.map((sight, i) => (
                <TiltCard key={i} className="flex-shrink-0 w-64 rounded-2xl" maxTilt={6}>
                  <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg group cursor-pointer">
                    <img src={sight.img} alt={isKa ? sight.titleKa : sight.titleEn} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {/* Glassmorphism overlay on hover */}
                    <div className="absolute inset-0 sight-card-glass rounded-2xl" />
                    <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all hover:scale-110">
                      <span className="material-symbols-outlined text-lg">favorite</span>
                    </button>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="font-black text-base leading-tight">{isKa ? sight.titleKa : sight.titleEn}</p>
                      <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">{sight.catEn === 'Nature' ? 'eco' : 'church'}</span>
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

      {/* ════════════════════════════════════
          SECTION 6 — FAQ
          ════════════════════════════════════ */}
      <FAQ language={language} />

    </>
  );
}
