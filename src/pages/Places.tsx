// React 19 does not require explicit React import for JSX
import { Language } from '../translations';

const places = [
    {
        img: 'https://storage.georgia.travel/images/tbs.webp',
        titleKa: 'თბილისი',
        titleEn: 'Tbilisi',
        descKa: 'საქართველოს დედაქალაქი, სადაც ძველი და ახალი ერთმანეთს ეხამება. ძველი ქალაქის ვიწრო ქუჩები, ფერადი სახლები, აბანოთუბანის გოგირდის აბანოები, ნარიყალას ციხე-სიმაგრე და მშვიდობის ხიდი — ეს ყველაფერი ერთ ქალაქშია თავმოყრილი. თბილისის კულინარიული სცენა, ღამის ცხოვრება და კულტურული ღონისძიებები ყოველთვის იზიდავს მოგზაურებს.',
        descEn: 'Georgia\'s vibrant capital where old meets new. Winding Old Town streets, colorful houses, Abanotubani sulfur baths, Narikala Fortress and the Peace Bridge — all in one city. Tbilisi\'s food scene, nightlife, and cultural events constantly draw travelers.',
    },
    {
        img: 'https://storage.georgia.travel/images/mestia-gnta.webp',
        titleKa: 'სვანეთი',
        titleEn: 'Svaneti',
        descKa: 'კავკასიონის გულში მდებარე რეგიონი, რომელიც ცნობილია შუასაუკუნეების თავდაცვითი კოშკებით. მესტია რეგიონის ცენტრია, ხოლო უშგული — UNESCO-ს მემკვიდრეობის ძეგლი და ევროპის ერთ-ერთი ყველაზე მაღალი მუდმივად დასახლებული პუნქტი. ჩალადის მყინვარი, ყორულდის ტბები და ხატსვალის სათხილამურო — სვანეთი ყველა სეზონზე საინტერესოა.',
        descEn: 'A region in the heart of the Caucasus famous for its medieval defensive towers. Mestia is the capital, while Ushguli — a UNESCO Heritage site — is one of Europe\'s highest continuously inhabited settlements. Chalaadi Glacier, Koruldi Lakes, and Hatsvali ski resort make Svaneti a year-round destination.',
    },
    {
        img: 'https://storage.georgia.travel/images/gomi-mountain-gnta.webp',
        titleKa: 'ყაზბეგი (სტეფანწმინდა)',
        titleEn: 'Kazbegi (Stepantsminda)',
        descKa: 'საქართველოს სამხედრო გზა ერთ-ერთი ყველაზე ლამაზი მარშრუტია მსოფლიოში. გერგეტის სამების ეკლესია, ყაზბეგის მთის ფონზე, საქართველოს სიმბოლოა. თრუსოს ხეობა, ჯუთა და გველეთის ჩანჩქერები მოგზაურების საყვარელი მიმართულებებია.',
        descEn: 'The Georgian Military Highway is one of the world\'s most beautiful road trips. Gergeti Trinity Church against Mount Kazbek is a symbol of Georgia. Truso Valley, Juta, and Gveleti Waterfalls are travelers\' favorites.',
    },
    {
        img: 'https://storage.georgia.travel/images/batumi-gnta.webp',
        titleKa: 'ბათუმი და აჭარა',
        titleEn: 'Batumi & Adjara',
        descKa: 'შავი ზღვის სანაპიროზე მდებარე ბათუმი თანამედროვე არქიტექტურით, 7-კილომეტრიანი ბულვარით და ბოტანიკური ბაღით იზიდავს ტურისტებს. ალი და ნინოს ქანდაკება, ანბანის კოშკი და ძველი ქალაქის ევროპული სტილის პიაცა ქალაქის ვიზიტურ ბარათებს წარმოადგენს.',
        descEn: 'Batumi on the Black Sea coast attracts tourists with modern architecture, a 7-kilometer boulevard, and a botanical garden. The Ali & Nino statue, Alphabet Tower, and the European-style Piazza in the Old Town are the city\'s signature landmarks.',
    },
    {
        img: 'https://storage.georgia.travel/images/food-and-wine-georgia.webp',
        titleKa: 'კახეთი',
        titleEn: 'Kakheti',
        descKa: 'საქართველოს ღვინის მხარე — კახეთი ცნობილია მევენახეობით, სიღნაღის „სიყვარულის ქალაქით", ბოდბის მონასტრით და ალავერდის ტაძრით. მარანი, ქვევრი და ღვინის დეგუსტაცია — კახეთი ღვინის მოყვარულთა სამოთხეა.',
        descEn: 'Georgia\'s wine region — Kakheti is famous for viticulture, the "City of Love" Sighnaghi, Bodbe Monastery, and Alaverdi Cathedral. Wine cellars, Qvevri, and tasting experiences — Kakheti is a wine lover\'s paradise.',
    },
    {
        img: 'https://storage.georgia.travel/images/sataplia-cave-and-nature-reserve-gnta.webp',
        titleKa: 'ქუთაისი და იმერეთი',
        titleEn: 'Kutaisi & Imereti',
        descKa: 'საქართველოს მეორე ქალაქი — ქუთაისი გელათის მონასტრით, მარტვილისა და ოკაცეს კანიონებით და პრომეთეს მღვიმით იზიდავს ტურისტებს. იმერეთის რეგიონი ბუნებრივი სილამაზით და ისტორიული ძეგლებით მდიდარია.',
        descEn: 'Georgia\'s second city — Kutaisi draws tourists with Gelati Monastery, Martvili and Okatse Canyons, and Prometheus Cave. The Imereti region is rich in natural beauty and historical monuments.',
    },
];

export default function Places({ language }: { language: Language }) {
    const isKa = language === 'ka';

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
                            : 'Discover Georgia\'s most popular destinations'}
                    </p>
                </div>
            </section>

            {/* Places Grid */}
            <section className="py-20 bg-background-light">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {places.map((place, i) => (
                            <div key={i} className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={place.img}
                                        alt={isKa ? place.titleKa : place.titleEn}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    <div className="absolute bottom-4 left-5">
                                        <h2 className="text-white font-black text-2xl drop-shadow-lg">{isKa ? place.titleKa : place.titleEn}</h2>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-text-muted text-sm leading-relaxed">
                                        {isKa ? place.descKa : place.descEn}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
