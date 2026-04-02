import React from 'react';
import { Language, translations } from '../translations';

interface SeasonDestination {
    nameKa: string;
    nameEn: string;
    regionKa: string;
    regionEn: string;
    descKa: string;
    descEn: string;
    images: string[];
    activitiesKa: string[];
    activitiesEn: string[];
    bestTimeKa: string;
    bestTimeEn: string;
    altitude?: string;
}

const seasonDestinations: Record<string, SeasonDestination> = {
    'ზამთარი': {
        nameKa: 'გუდაური',
        nameEn: 'Gudauri',
        regionKa: 'მცხეთა-მთიანეთი',
        regionEn: 'Mtskheta-Mtianeti',
        descKa: 'გუდაური — საქართველოს ყველაზე პოპულარული სათხილამურო კურორტია, რომელიც მდებარეობს საქართველოს სამხედრო გზაზე, ზღვის დონიდან 2,196 მეტრ სიმაღლეზე. კურორტი განთქმულია თოვლის საფარის ხარისხით, ფრირაიდის შესაძლებლობებით და თანამედროვე ინფრასტრუქტურით. აქ 57 კილომეტრი სათხილამურო ტრასაა სხვადასხვა სირთულის.',
        descEn: 'Gudauri is Georgia\'s most popular ski resort, located on the Georgian Military Highway at 2,196 meters above sea level. The resort is known for its excellent snow quality, freeride opportunities, and modern infrastructure, featuring 57 km of ski runs of varying difficulty.',
        images: [
            'https://storage.georgia.travel/images/gudauri.webp',
            'https://storage.georgia.travel/images/gomi-mountain-gnta.webp',
        ],
        activitiesKa: ['სათხილამურო', 'სნოუბორდი', 'ფრირაიდი', 'პარაგლაიდინგი', 'ჰელი-სქი'],
        activitiesEn: ['Skiing', 'Snowboarding', 'Freeride', 'Paragliding', 'Heli-skiing'],
        bestTimeKa: 'დეკემბერი — აპრილი',
        bestTimeEn: 'December — April',
        altitude: '2,196 მ',
    },
    'გაზაფხული': {
        nameKa: 'ყაზბეგი (სტეფანწმინდა)',
        nameEn: 'Kazbegi (Stepantsminda)',
        regionKa: 'მცხეთა-მთიანეთი',
        regionEn: 'Mtskheta-Mtianeti',
        descKa: 'გაზაფხულზე ყაზბეგი განსაკუთრებით ლამაზია — მთები მწვანდება, ალპური ყვავილები იწყებს ყვავილობას, ხოლო გერგეტის სამების ეკლესია მარადთოვლიანი ყაზბეგის ფონზე თვალისმომჭრელ ხედს ქმნის. ეს არის ლაშქრობისა და ფოტოგრაფიის საუკეთესო პერიოდი.',
        descEn: 'In spring, Kazbegi is especially beautiful — mountains turn green, alpine flowers begin to bloom, and Gergeti Trinity Church creates a breathtaking view against the backdrop of snow-capped Mount Kazbek. This is the best period for hiking and photography.',
        images: [
            'https://storage.georgia.travel/images/gomi-mountain-gnta.webp',
            'https://storage.georgia.travel/images/nature-of-georgia.webp',
        ],
        activitiesKa: ['ლაშქრობა', 'ალპინიზმი', 'ფოტოგრაფია', 'ცხენებით სეირნობა'],
        activitiesEn: ['Hiking', 'Mountaineering', 'Photography', 'Horseback riding'],
        bestTimeKa: 'მარტი — მაისი',
        bestTimeEn: 'March — May',
        altitude: '1,744 მ',
    },
    'ზაფხული': {
        nameKa: 'ბათუმი',
        nameEn: 'Batumi',
        regionKa: 'აჭარა',
        regionEn: 'Adjara',
        descKa: 'ზაფხულში ბათუმი საქართველოს ყველაზე პოპულარული კურორტია. შავი ზღვის სანაპირო, 7-კილომეტრიანი ბულვარი, ტროპიკული ბოტანიკური ბაღი, თანამედროვე არქიტექტურა და აჭარული სამზარეულო — აქ ყველაფერს ნახავ.',
        descEn: 'In summer, Batumi is Georgia\'s most popular resort. The Black Sea coast, 7-kilometer boulevard, tropical botanical garden, modern architecture, and Adjarian cuisine — you\'ll find everything here.',
        images: [
            'https://storage.georgia.travel/images/batumi-gnta.webp',
            'https://storage.georgia.travel/images/bakhmaro-gnta.webp',
        ],
        activitiesKa: ['ზღვაში ბანაობა', 'ბულვარზე სეირნობა', 'დელფინარიუმი', 'ბოტანიკური ბაღი', 'წყალქვეშა სამყარო'],
        activitiesEn: ['Swimming', 'Boulevard walk', 'Dolphinarium', 'Botanical Garden', 'Aquarium'],
        bestTimeKa: 'ივნისი — სექტემბერი',
        bestTimeEn: 'June — September',
    },
    'შემოდგომა': {
        nameKa: 'კახეთი (სიღნაღი & თელავი)',
        nameEn: 'Kakheti (Sighnaghi & Telavi)',
        regionKa: 'კახეთი',
        regionEn: 'Kakheti',
        descKa: 'შემოდგომა კახეთში ყურძნის კრეფისა და ღვინის დაყენების სეზონია — „რთველი". სიღნაღის პატარა ქალაქი, ალაზნის ველი, ძველი მარნები და ქვევრის ღვინო — ეს ყველაფერი შემოდგომას განსაკუთრებულ მომხიბვლელობას მატებს.',
        descEn: 'Autumn in Kakheti is the season of grape harvest and winemaking — "Rtveli". The small town of Sighnaghi, Alazani Valley, ancient wine cellars and Qvevri wine — all of this gives autumn a special charm.',
        images: [
            'https://storage.georgia.travel/images/food-and-wine-georgia.webp',
            'https://storage.georgia.travel/images/why-georgia-nature.webp',
        ],
        activitiesKa: ['ღვინის დეგუსტაცია', 'რთველი', 'მარნების მონახულება', 'ალაზნის ველზე სეირნობა'],
        activitiesEn: ['Wine tasting', 'Grape harvest', 'Cellar tours', 'Alazani Valley walk'],
        bestTimeKa: 'სექტემბერი — ნოემბერი',
        bestTimeEn: 'September — November',
    },
};

interface SeasonModalProps {
    season: string;
    language: Language;
    onClose: () => void;
}

export default function SeasonModal({ season, language, onClose }: SeasonModalProps) {
    const dest = seasonDestinations[season];
    const t = translations[language];
    const isKa = language === 'ka';

    if (!dest) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Image Gallery */}
                <div className="grid grid-cols-2 gap-1 h-64 sm:h-80 rounded-t-3xl overflow-hidden">
                    {dest.images.map((img, i) => (
                        <div key={i} className={`relative overflow-hidden ${i === 0 ? 'col-span-2 sm:col-span-1' : ''}`}>
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            {i === 0 && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
                                {t.popular_in_season}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-text-main">
                                {isKa ? dest.nameKa : dest.nameEn}
                            </h2>
                            <p className="text-sm text-text-muted font-medium mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                {isKa ? dest.regionKa : dest.regionEn}
                                {dest.altitude && (
                                    <span className="ml-2 text-xs bg-background-light px-2 py-0.5 rounded-full">⛰ {dest.altitude}</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 leading-relaxed mb-6">
                        {isKa ? dest.descKa : dest.descEn}
                    </p>

                    {/* Activities */}
                    <div className="mb-6">
                        <h3 className="font-black text-text-main text-sm mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">hiking</span>
                            {t.activities}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {(isKa ? dest.activitiesKa : dest.activitiesEn).map((act, i) => (
                                <span key={i} className="px-3 py-1.5 bg-background-light rounded-full text-sm font-medium text-text-main border border-border-light">
                                    {act}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Best Time */}
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 mb-6">
                        <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
                        <div>
                            <p className="text-xs font-bold text-text-muted">{t.best_time}</p>
                            <p className="font-black text-text-main">{isKa ? dest.bestTimeKa : dest.bestTimeEn}</p>
                        </div>
                    </div>

                    {/* Close CTA */}
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary text-primary-content font-black rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                        {t.close}
                    </button>
                </div>
            </div>
        </div>
    );
}
