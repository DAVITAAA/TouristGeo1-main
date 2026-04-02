import { Language, translations } from '../translations';
import { motion } from 'motion/react';

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

export default function WhyGeorgia({ language }: { language: Language }) {
  const isKa = language === 'ka';
  const t = translations[language];

  return (
    <div className="min-h-screen bg-background-light">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-8 z-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20"
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
                className="text-5xl md:text-7xl font-black text-text-main leading-none tracking-tight"
              >
                {t.wg_hero_title}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-text-muted leading-relaxed max-w-xl"
              >
                {t.wg_hero_desc}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-4"
              >
                <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined">explore</span>
                  {t.wg_start_planning}
                </button>
                <button className="px-8 py-4 bg-white text-text-main rounded-2xl font-black shadow-lg border border-border-light hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined filled">play_circle</span>
                  {t.wg_watch_video}
                </button>
              </motion.div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="relative z-0 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white"
              >
                <img 
                  src="https://storage.georgia.travel/images/nature-of-georgia.webp" 
                  alt="Georgia Landscape"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Weather Widget */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-6 left-6 right-6 glass p-6 rounded-3xl flex items-center justify-between text-white"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{t.wg_weather_label}</p>
                    <p className="text-xl font-black">{isKa ? 'თბილისი, 24°C' : 'Tbilisi, 24°C'}</p>
                  </div>
                  <span className="material-symbols-outlined text-4xl">wb_sunny</span>
                </motion.div>
              </motion.div>
              
              {/* Decorative Orbs */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent-blue/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {icons.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-border-light shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{isKa ? item.labelKa : item.label}</p>
                  <p className="text-lg font-black text-text-main">{isKa ? item.valueKa : item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-text-main">{t.wg_iconic_destinations}</h2>
              <p className="text-text-muted font-medium">{t.wg_destinations_subtitle}</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-primary font-black group">
              {t.view_all}
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {destinations.map((dest, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative h-[450px] rounded-[32px] overflow-hidden shadow-xl"
              >
                <img src={dest.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    {isKa ? dest.badgeKa : dest.badgeEn}
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                  <h3 className="text-2xl font-black text-white">{isKa ? dest.titleKa : dest.titleEn}</h3>
                  <p className="text-white/70 text-sm font-medium line-clamp-2">{isKa ? dest.descKa : dest.descEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Regional Map Section */}
      <section className="py-24 px-4 bg-white/50 border-y border-border-light">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-2/3 space-y-8">
              <h2 className="text-4xl font-black text-text-main">{t.wg_explore_regions}</h2>
              
              <div className="flex gap-4">
                {['Mountains', 'Sea', 'Plains'].map(tag => (
                  <button key={tag} className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                    {tag}
                  </button>
                ))}
              </div>

              <div className="relative aspect-video rounded-[40px] overflow-hidden bg-slate-900 shadow-inner group">
                <img 
                  src="https://images.unsplash.com/photo-1565008415888-c309837966bc?auto=format&fit=crop&w=1200&q=80" 
                  className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" 
                  alt="Topographic Map" 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white space-y-4">
                    <span className="material-symbols-outlined text-[64px] animate-bounce">location_on</span>
                    <p className="text-xl font-black uppercase tracking-[0.2em]">{t.wg_interactive_map}</p>
                  </div>
                </div>
                
                {/* Marker Dots */}
                <div className="absolute top-1/2 left-1/4 h-3 w-3 bg-primary rounded-full shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-pulse" />
                <div className="absolute top-1/3 right-1/4 h-3 w-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />
                <div className="absolute bottom-1/4 left-1/2 h-3 w-3 bg-accent-blue rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse" />
              </div>
            </div>

            <div className="lg:w-1/3 space-y-10">
              <h3 className="text-2xl font-black text-text-main">{t.wg_travel_planner}</h3>
              
              <div className="space-y-4">
                {[
                  { title: isKa ? 'ტრანსპორტირება' : 'Getting There', desc: isKa ? 'პირდაპირი რეისები ევროპიდან და აზიიდან' : 'Direct flights from Europe & Asia', icon: 'flight_takeoff' },
                  { title: isKa ? 'საუკეთესო დრო' : 'Best Time to Visit', desc: isKa ? 'აპრილი - ივნისი ან სექტემბერი - ოქტომბერი' : 'April - June or Sept - October', icon: 'event' },
                  { title: isKa ? 'ადგილობრივი ტრანსპორტი' : 'Local Transport', desc: isKa ? 'მატარებლები, ავტობუსები და ტაქსის აპლიკაციები' : 'Trains, buses and taxi apps', icon: 'directions_bus' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-border-light shadow-sm hover:shadow-md hover:translate-x-2 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-accent-blue/5 flex items-center justify-center text-accent-blue">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-text-main">{item.title}</h4>
                      <p className="text-sm text-text-muted font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 rounded-[32px] bg-secondary text-white space-y-6 relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <h4 className="text-xl font-black">{t.wg_free_eguide}</h4>
                  <p className="text-white/60 text-sm font-medium">{t.wg_eguide_desc}</p>
                  <button className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">download</span>
                    {t.wg_download_now}
                  </button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimal info */}
      <footer className="py-12 border-t border-border-light">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-primary font-black text-2xl italic tracking-tighter">
            George<span className="text-text-main">Tours</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-text-muted uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">{isKa ? 'კონფიდენციალურობა' : 'Privacy'}</a>
            <a href="#" className="hover:text-primary transition-colors">{isKa ? 'წესები' : 'Terms'}</a>
            <a href="#" className="hover:text-primary transition-colors">{t.contact}</a>
          </div>
          <p className="text-text-muted text-xs font-bold">© 2024 Georgian Tourism Board. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
