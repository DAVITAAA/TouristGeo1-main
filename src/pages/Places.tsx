import { useState } from 'react';
import { Language } from '../translations';
import { georgianSights } from '../data/georgianSights';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MapPin } from 'lucide-react';

const places = [
    {
        id: 'tbilisi',
        img: 'https://storage.georgia.travel/images/tbs.webp',
        titleKa: 'თბილისი',
        titleEn: 'Tbilisi',
        descKa: 'საქართველოს დედაქალაქი, სადაც ძველი და ახალი ერთმანეთს ეხამება. ძველი ქალაქის ვიწრო ქუჩები, ფერადი სახლები, აბანოთუბანის გოგირდის აბანოები, ნარიყალას ციხე-სიმაგრე და მშვიდობის ხიდი.',
        descEn: "Georgia's vibrant capital where old meets new. Winding Old Town streets, colorful houses, Abanotubani sulfur baths, Narikala Fortress and the Peace Bridge.",
        matchLocations: ['Tbilisi'],
    },
    {
        id: 'mtskheta',
        img: 'https://storage.georgia.travel/images/svetitskhoveli-cathedral-gnta.webp',
        titleKa: 'მცხეთა',
        titleEn: 'Mtskheta',
        descKa: 'საქართველოს უძველესი დედაქალაქი და სულიერი ცენტრი. UNESCO-ს მემკვიდრეობის ძეგლები — სვეტიცხოველი და ჯვარი.',
        descEn: "Georgia's ancient capital and spiritual center. Home to UNESCO World Heritage Sites — Svetitskhoveli Cathedral and Jvari Monastery.",
        matchLocations: ['Mtskheta', 'Mtskheta-Mtianeti', 'Gori'],
    },
    {
        id: 'svaneti',
        img: 'https://storage.georgia.travel/images/mestia-gnta.webp',
        titleKa: 'სვანეთი',
        titleEn: 'Svaneti',
        descKa: 'კავკასიონის გულში მდებარე რეგიონი, ცნობილია შუასაუკუნეების თავდაცვითი კოშკებით. მესტია და უშგული — UNESCO-ს ძეგლი.',
        descEn: "A region in the heart of the Caucasus famous for medieval defensive towers. Mestia and Ushguli — a UNESCO Heritage site.",
        matchLocations: ['Svaneti'],
    },
    {
        id: 'kazbegi',
        img: 'https://storage.georgia.travel/images/gomi-mountain-gnta.webp',
        titleKa: 'ყაზბეგი (სტეფანწმინდა)',
        titleEn: 'Kazbegi (Stepantsminda)',
        descKa: 'საქართველოს სამხედრო გზა — მსოფლიოს ერთ-ერთი ყველაზე ლამაზი მარშრუტი. გერგეტის სამება, თრუსოს ხეობა.',
        descEn: "The Georgian Military Highway — one of the world's most beautiful road trips. Gergeti Trinity Church, Truso Valley.",
        matchLocations: ['Kazbegi'],
    },
    {
        id: 'adjara',
        img: 'https://storage.georgia.travel/images/batumi-gnta.webp',
        titleKa: 'ბათუმი და აჭარა',
        titleEn: 'Batumi & Adjara',
        descKa: 'შავი ზღვის სანაპიროზე მდებარე ბათუმი თანამედროვე არქიტექტურით, ბულვარით და ბოტანიკური ბაღით იზიდავს ტურისტებს.',
        descEn: "Batumi on the Black Sea coast attracts with modern architecture, a 7-km boulevard, and botanical garden.",
        matchLocations: ['Adjara'],
    },
    {
        id: 'kakheti',
        img: 'https://storage.georgia.travel/images/food-and-wine-georgia.webp',
        titleKa: 'კახეთი',
        titleEn: 'Kakheti',
        descKa: 'საქართველოს ღვინის მხარე — სიღნაღი, ბოდბის მონასტერი, ალავერდის ტაძარი. ქვევრი და ღვინის დეგუსტაცია.',
        descEn: "Georgia's wine region — Sighnaghi, Bodbe Monastery, Alaverdi Cathedral. Wine cellars, Qvevri, and tastings.",
        matchLocations: ['Kakheti'],
    },
    {
        id: 'imereti',
        img: 'https://storage.georgia.travel/images/sataplia-cave-and-nature-reserve-gnta.webp',
        titleKa: 'ქუთაისი და იმერეთი',
        titleEn: 'Kutaisi & Imereti',
        descKa: 'საქართველოს მეორე ქალაქი — გელათის მონასტერი, ოკაცეს კანიონი, პრომეთეს მღვიმე. ბუნებრივი სილამაზე და ისტორია.',
        descEn: "Georgia's second city — Gelati Monastery, Okatse Canyon, Prometheus Cave. Rich in natural beauty and history.",
        matchLocations: ['Imereti', 'Kutaisi', 'Samegrelo'],
    },
    {
        id: 'samtskhe',
        img: 'https://storage.georgia.travel/images/vardzia-gnta.webp',
        titleKa: 'სამცხე-ჯავახეთი',
        titleEn: 'Samtskhe-Javakheti',
        descKa: 'ვარძიის გამოქვაბული ქალაქი, რაბათის ციხე და ხერთვისის ციხე-სიმაგრე — ისტორიით გაჯერებული რეგიონი.',
        descEn: "Vardzia cave city, Rabati Castle, and Khertvisi Fortress — a region steeped in history near the Turkish border.",
        matchLocations: ['Aspindza', 'Akhaltsikhe', 'Samtskhe-Javakheti'],
    },
    {
        id: 'mountain',
        img: 'https://storage.georgia.travel/images/abudelauri-lake-georgia.webp',
        titleKa: 'ხევსურეთი და თუშეთი',
        titleEn: 'Khevsureti & Tusheti',
        descKa: 'საქართველოს ყველაზე მიუწვდომელი მთიანი რეგიონები — შატილი, ომალო, აბუდელაურის ტბები. ხელუხლებელი ბუნება.',
        descEn: "Georgia's most remote mountain regions — Shatili, Omalo, Abudelauri Lakes. Untouched wilderness and ancient culture.",
        matchLocations: ['Khevsureti', 'Tusheti'],
    },
];

export default function Places({ language }: { language: Language }) {
    const isKa = language === 'ka';
    const [expandedPlace, setExpandedPlace] = useState<string | null>(null);

    const getSightsForPlace = (matchLocations: string[]) => {
        return georgianSights.filter(s => matchLocations.includes(s.locationEn));
    };

    const togglePlace = (id: string) => {
        setExpandedPlace(prev => prev === id ? null : id);
    };

    return (
        <>
            {/* Hero */}
            <section className="relative h-[280px] sm:h-[380px] overflow-hidden">
                <img
                    src="https://storage.georgia.travel/images/tbs.webp"
                    alt="Georgian Destinations"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                <div className="relative z-10 h-full flex flex-col justify-end items-center pb-14 text-center text-white px-4">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight drop-shadow-2xl">
                        {isKa ? 'ადგილები' : 'Places'}
                    </h1>
                    <p className="mt-4 text-lg md:text-xl max-w-2xl text-white/85 font-medium">
                        {isKa
                            ? 'აღმოაჩინე საქართველოს ყველაზე პოპულარული მიმართულებები'
                            : "Discover Georgia's most popular destinations"}
                    </p>
                </div>
            </section>

            {/* Places Grid */}
            <section className="py-20 bg-background-light">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {places.map((place) => {
                            const regionSights = getSightsForPlace(place.matchLocations);
                            const isExpanded = expandedPlace === place.id;

                            return (
                                <div key={place.id} className={`transition-all duration-500 ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                                    <div
                                        className={`group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer ${!isExpanded ? 'hover:-translate-y-2' : ''}`}
                                        onClick={() => togglePlace(place.id)}
                                    >
                                        <div className="relative h-56 overflow-hidden">
                                            <img
                                                src={place.img}
                                                alt={isKa ? place.titleKa : place.titleEn}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                                                <h2 className="text-white font-black text-2xl drop-shadow-lg">{isKa ? place.titleKa : place.titleEn}</h2>
                                                <div className="flex items-center gap-2">
                                                    {regionSights.length > 0 && (
                                                        <span className="px-2.5 py-1 bg-primary/90 backdrop-blur text-white text-[10px] font-black rounded-lg">
                                                            {regionSights.length} {isKa ? 'ადგილი' : 'sites'}
                                                        </span>
                                                    )}
                                                    <motion.div
                                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white"
                                                    >
                                                        <ChevronDown size={18} />
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-text-muted text-sm leading-relaxed">
                                                {isKa ? place.descKa : place.descEn}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expanded Sights Dropdown */}
                                    <AnimatePresence>
                                        {isExpanded && regionSights.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-4 pb-2">
                                                    <div className="flex items-center gap-2 mb-4 px-1">
                                                        <div className="w-8 h-[2px] bg-primary rounded-full" />
                                                        <span className="text-xs font-black text-primary uppercase tracking-widest">
                                                            {isKa ? 'სანახაობები ამ რეგიონში' : 'Sights in this region'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {regionSights.map((sight) => (
                                                            <motion.div
                                                                key={sight.id}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.3 }}
                                                                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                                                            >
                                                                <div className="relative h-36 overflow-hidden">
                                                                    <img
                                                                        src={sight.img}
                                                                        alt={isKa ? sight.titleKa : sight.titleEn}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {sight.unesco && (
                                                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded">
                                                                            UNESCO
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                                                </div>
                                                                <div className="p-4">
                                                                    <div className="flex items-center gap-1.5 mb-1">
                                                                        <MapPin size={12} className="text-primary" />
                                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{isKa ? sight.locationKa : sight.locationEn}</span>
                                                                    </div>
                                                                    <h3 className="text-sm font-black text-text-main leading-tight mb-1.5">{isKa ? sight.titleKa : sight.titleEn}</h3>
                                                                    <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
                                                                        {isKa ? sight.descKa : sight.descEn}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}
