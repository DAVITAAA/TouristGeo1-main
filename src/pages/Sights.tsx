import { useEffect, useRef } from 'react';
import { Language } from '../translations';
import { georgianSights } from '../data/georgianSights';

const typeIcons: Record<string, string> = {
  church: 'church',
  monastery: 'account_balance',
  fortress: 'castle',
  nature: 'park',
  cave: 'landscape',
  canyon: 'terrain',
  waterfall: 'water_drop',
  landmark: 'location_city',
  village: 'holiday_village',
  lake: 'water',
  waves: 'waves',
  city: 'location_city',
};

export default function Sights({ language, selectedSightId }: { language: Language; selectedSightId?: string | null }) {
    const isKa = language === 'ka';
    const sightRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (selectedSightId && sightRefs.current[selectedSightId]) {
            setTimeout(() => {
                sightRefs.current[selectedSightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
        }
    }, [selectedSightId]);

    return (
        <>
            {/* Hero */}
            <section className="relative h-[280px] sm:h-[380px] overflow-hidden">
                <img
                    src="https://storage.georgia.travel/images/svetitskhoveli-cathedral-gnta.webp"
                    alt="Georgian Sights"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                <div className="relative z-10 h-full flex flex-col justify-end items-center pb-14 text-center text-white px-4">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight drop-shadow-2xl">
                        {isKa ? 'სანახაობები' : 'Sights'}
                    </h1>
                    <p className="mt-4 text-lg md:text-xl max-w-2xl text-white/85 font-medium">
                        {isKa
                            ? 'საქართველოს ყველაზე შთამბეჭდავი და აუცილებელი სანახაობები'
                            : "Georgia's most impressive must-see landmarks"}
                    </p>
                </div>
            </section>

            {/* Sights Grid */}
            <section className="py-20 bg-background-light">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {georgianSights.map((item) => {
                            const isHighlighted = selectedSightId === item.id;
                            return (
                                <div
                                    key={item.id}
                                    ref={(el) => { sightRefs.current[item.id] = el; }}
                                    className={`group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col sm:flex-row ${isHighlighted ? 'ring-4 ring-primary ring-offset-4 scale-[1.02]' : ''}`}
                                >
                                    <div className="relative sm:w-56 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                                        <img
                                            src={item.img}
                                            alt={isKa ? item.titleKa : item.titleEn}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        {item.unesco && (
                                            <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                                                UNESCO
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-primary text-lg">{typeIcons[item.type] || 'location_on'}</span>
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider">{isKa ? item.locationKa : item.locationEn}</span>
                                        </div>
                                        <h2 className="text-xl font-black text-text-main leading-tight mb-2">{isKa ? item.titleKa : item.titleEn}</h2>
                                        <p className="text-text-muted text-sm leading-relaxed">
                                            {isKa ? item.descKa : item.descEn}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}
