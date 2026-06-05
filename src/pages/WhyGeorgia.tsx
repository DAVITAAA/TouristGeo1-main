import { Language, translations } from '../translations';
import { motion } from 'motion/react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import React from 'react';

const icons = [
  { label: 'Capital City', labelKa: 'დედაქალაქი', value: 'Tbilisi', valueKa: 'თბილისი', icon: 'domain' },
  { label: 'Currency', labelKa: 'ვალუტა', value: 'Lari (GEL)', valueKa: 'ლარი (GEL)', icon: 'payments' },
  { label: 'Language', labelKa: 'ენა', value: 'Georgian (Kartuli)', valueKa: 'ქართული', icon: 'translate' },
  { label: 'Famous For', labelKa: 'ცნობილია', value: '8,000 Vintages', valueKa: '8,000 მოსავალი', icon: 'local_winery' },
];

const destinations = [
  {
    titleKa: 'სვანეთის კოშკები',
    titleEn: 'Svaneti Towers',
    descKa: 'უძველესი თავდაცვითი ნაგებობები კავკასიონის ფონზე.',
    descEn: 'Ancient medieval defense towers set against dramatic Alpine scenery.',
    img: 'https://storage.georgia.travel/images/nature-of-georgia.webp',
    badgeKa: 'მაღალმთიანი სვანეთი',
    badgeEn: 'High Caucasus'
  },
  {
    titleKa: 'კახეთის ვენახები',
    titleEn: 'Kakheti Vineyards',
    descKa: 'ღვინის აკვანი და 8000 წლიანი ტრადიცია.',
    descEn: 'The cradle of wine, home to traditional Qvevri winemaking techniques.',
    img: 'https://storage.georgia.travel/images/food-and-wine-georgia.webp',
    badgeKa: 'ღვინის მხარე',
    badgeEn: 'Wine Heartland'
  },
  {
    titleKa: 'გერგეტის სამება',
    titleEn: 'Gergeti Trinity',
    descKa: 'XIV საუკუნის ტაძარი ყაზბეგის მწვერვალის ძირას.',
    descEn: 'A 14th-century church perched dramatically under Mount Kazbek.',
    img: 'https://storage.georgia.travel/images/why-georgia-nature.webp',
    badgeKa: 'ყველაზე ფოტოგენური',
    badgeEn: 'Most Photogenic'
  }
];

function Reveal({ children, delay = 0, variant = 'up' }: { children: React.ReactNode, delay?: number, variant?: 'up'|'scale' }) {
    const { ref, isVisible } = useScrollReveal();
    const baseClass = variant === 'scale' ? 'scroll-reveal-scale' : 'scroll-reveal';
    return (
        <div ref={ref} className={`${baseClass} ${isVisible ? 'visible' : ''}`} style={{ transitionDelay: `${delay}s` }}>
            {children}
        </div>
    );
}

export default function WhyGeorgia({ language }: { language: Language }) {
  const isKa = language === 'ka';
  const t = translations[language];

  return (
    <div className="min-h-screen bg-background-light">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 space-y-8 z-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {t.wg_hero_badge}
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-text-main leading-[1.1] tracking-tight font-display"
              >
                {t.wg_hero_title}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-base sm:text-lg text-text-muted leading-relaxed max-w-xl font-medium"
              >
                {t.wg_hero_desc}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-4 pt-4"
              >
                <button className="px-8 py-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">explore</span>
                  {t.wg_start_planning}
                </button>
                <button className="px-8 py-4 bg-white text-text-main rounded-xl font-semibold shadow-sm border border-border-light hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] filled text-primary">play_circle</span>
                  {t.wg_watch_video}
                </button>
              </motion.div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] max-w-md mx-auto"
              >
                <img 
                  src="https://storage.georgia.travel/images/nature-of-georgia.webp" 
                  alt="Georgia Landscape"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                
                {/* Weather Widget */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md p-5 rounded-2xl flex items-center justify-between text-white border border-white/20 shadow-lg"
                >
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{t.wg_weather_label}</p>
                    <p className="text-xl font-bold font-display">{isKa ? 'თბილისი, 24°C' : 'Tbilisi, 24°C'}</p>
                  </div>
                  <span className="material-symbols-outlined text-4xl text-yellow-400">wb_sunny</span>
                </motion.div>
              </motion.div>
              
              {/* Decorative Orbs - Subtler */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-0" />
              <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-accent-blue/10 rounded-full blur-[80px] -z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {icons.map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="bg-white p-5 rounded-2xl border border-border-light shadow-sm flex flex-col items-start gap-4 hover:shadow-md hover:border-gray-300 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <div className="space-y-0.5 text-left">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{isKa ? item.labelKa : item.label}</p>
                    <p className="text-[15px] font-bold text-text-main font-display">{isKa ? item.valueKa : item.value}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) 0' }} className="px-4">
        <div className="container mx-auto max-w-7xl">
          <Reveal>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main font-display leading-tight">{t.wg_iconic_destinations}</h2>
                  <p className="text-text-muted font-medium text-[15px]">{t.wg_destinations_subtitle}</p>
                </div>
                <button className="hidden sm:flex items-center gap-2 text-primary font-semibold text-[13px] group bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors">
                  {t.view_all}
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                </button>
              </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {destinations.map((dest, i) => (
              <Reveal key={i} delay={i * 0.1} variant="scale">
                  <div className="group relative h-[320px] sm:h-[420px] rounded-2xl overflow-hidden shadow-md">
                    <img src={dest.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                    
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/20 shadow-sm">
                        {isKa ? dest.badgeKa : dest.badgeEn}
                      </span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 space-y-1.5">
                      <h3 className="text-2xl font-bold text-white font-display">{isKa ? dest.titleKa : dest.titleEn}</h3>
                      <p className="text-white/80 text-[13px] font-medium leading-relaxed">{isKa ? dest.descKa : dest.descEn}</p>
                    </div>
                  </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Regional Map Section */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) 0' }} className="px-4 bg-white border-y border-border-light">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            <div className="lg:w-1/2 space-y-8">
              <Reveal>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main font-display leading-tight">{t.wg_explore_regions}</h2>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['Mountains', 'Sea', 'Plains'].map(tag => (
                      <span key={tag} className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-gray-50 text-text-muted border border-border-light">
                        {tag}
                      </span>
                    ))}
                  </div>
              </Reveal>

              <Reveal delay={0.1}>
                  <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#0f172a] shadow-xl group border border-border-light">
                    <img 
                      src="https://images.unsplash.com/photo-1565008415888-c309837966bc?auto=format&fit=crop&w=1200&q=80" 
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-70 mix-blend-overlay transition-all duration-700" 
                      alt="Topographic Map" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white space-y-3 p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10">
                        <span className="material-symbols-outlined text-[48px] text-primary">location_on</span>
                        <p className="text-sm font-bold uppercase tracking-[0.2em]">{t.wg_interactive_map}</p>
                      </div>
                    </div>
                    
                    {/* Marker Dots */}
                    <div className="absolute top-1/2 left-1/4 h-2.5 w-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(29,185,84,0.8)] animate-pulse" />
                    <div className="absolute top-1/3 right-1/4 h-2.5 w-2.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
              </Reveal>
            </div>

            <div className="lg:w-1/2 space-y-10">
              <Reveal delay={0.2}>
                  <h3 className="text-2xl font-bold text-text-main font-display mb-6">{t.wg_travel_planner}</h3>
                  
                  <div className="space-y-4">
                    {[
                      { title: isKa ? 'ტრანსპორტირება' : 'Getting There', desc: isKa ? 'პირდაპირი რეისები ევროპიდან და აზიიდან' : 'Direct flights from Europe & Asia', icon: 'flight_takeoff' },
                      { title: isKa ? 'საუკეთესო დრო' : 'Best Time to Visit', desc: isKa ? 'აპრილი - ივნისი ან სექტემბერი - ოქტომბერი' : 'April - June or Sept - October', icon: 'event' },
                      { title: isKa ? 'ადგილობრივი ტრანსპორტი' : 'Local Transport', desc: isKa ? 'მატარებლები, ავტობუსები და ტაქსის აპლიკაციები' : 'Trains, buses and taxi apps', icon: 'directions_bus' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-gray-50 border border-border-light hover:border-gray-300 hover:bg-white transition-all">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-text-main text-[15px]">{item.title}</h4>
                          <p className="text-[13px] text-text-muted font-medium mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              </Reveal>

              <Reveal delay={0.3}>
                  <div className="p-8 rounded-3xl bg-secondary text-white space-y-5 relative overflow-hidden shadow-lg shadow-secondary/20">
                    <div className="relative z-10 space-y-3">
                      <h4 className="text-xl font-bold font-display">{t.wg_free_eguide}</h4>
                      <p className="text-white/70 text-[13px] leading-relaxed max-w-sm">{t.wg_eguide_desc}</p>
                      <button className="w-full sm:w-auto px-6 py-3 mt-2 bg-primary text-white rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        {t.wg_download_now}
                      </button>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 border-[20px] border-white/5 rounded-full" />
                  </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
