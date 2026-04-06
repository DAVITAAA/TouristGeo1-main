// React 19 does not require explicit React import for JSX
import { Language } from '../translations';

const sights = [
    {
        img: 'https://storage.georgia.travel/images/svetitskhoveli-cathedral-gnta.webp',
        titleKa: 'სვეტიცხოველი',
        titleEn: 'Svetitskhoveli Cathedral',
        locationKa: 'მცხეთა',
        locationEn: 'Mtskheta',
        descKa: 'საქართველოს სულიერი ცენტრი და UNESCO-ს მსოფლიო მემკვიდრეობის ძეგლი. XI საუკუნის კათედრალი მცხეთაში — საქართველოს უძველეს დედაქალაქში. ეს ადგილი საქართველოს ქრისტიანული ისტორიის გულია.',
        descEn: 'Georgia\'s spiritual center and a UNESCO World Heritage Site. This 11th-century cathedral in Mtskheta — Georgia\'s ancient capital — is the heart of the country\'s Christian history.',
    },
    {
        img: 'https://storage.georgia.travel/images/vardzia-gnta.webp',
        titleKa: 'ვარძია',
        titleEn: 'Vardzia',
        locationKa: 'ასპინძა',
        locationEn: 'Aspindza',
        descKa: 'XII საუკუნის გამოქვაბული ქალაქ-მონასტერი, რომელიც კლდეში გამოკვეთილია. თავდაპირველად 6000 ბინა, ეკლესია, აფთიაქი და საწყობები ჰქონდა. თამარ მეფის ეპოქის შედევრი საქართველოს ოქროს ხანას წარმოაჩენს.',
        descEn: 'A 12th-century cave monastery complex carved into a cliff face. Originally with 6,000 apartments, churches, and storage rooms. This masterpiece from Queen Tamar\'s era showcases Georgia\'s Golden Age.',
    },
    {
        img: 'https://storage.georgia.travel/images/okatse-canyon-gnta.webp',
        titleKa: 'ოკაცეს კანიონი',
        titleEn: 'Okatse Canyon',
        locationKa: 'იმერეთი',
        locationEn: 'Imereti',
        descKa: 'თვალწარმტაცი კანიონი იმერეთის რეგიონში, სადაც გამჭვირვალე ბილიკი 140 მეტრის სიმაღლეზე გადის უფსკრულის ზემოთ. ადრენალინის მოყვარულთათვის ეს უნიკალური გამოცდილებაა.',
        descEn: 'A stunning canyon in the Imereti region with a transparent walkway hanging 140 meters above the abyss. An unmissable experience for adrenaline seekers.',
    },
    {
        img: 'https://storage.georgia.travel/images/abudelauri-lake-georgia.webp',
        titleKa: 'აბუდელაურის ფერადი ტბები',
        titleEn: 'Abudelauri Colorful Lakes',
        locationKa: 'ხევსურეთი',
        locationEn: 'Khevsureti',
        descKa: 'სამი ალპური ტბა კავკასიონის გულში — ლურჯი, მწვანე და თეთრი. ტბები სეზონის მიხედვით ფერს იცვლიან და ტრეკინგის მოყვარულთა საყვარელ მიმართულებას წარმოადგენს.',
        descEn: 'Three alpine lakes in the heart of the Caucasus — blue, green, and white. They change color with the seasons and are a favorite trekking destination.',
    },
    {
        img: 'https://storage.georgia.travel/images/gomi-mountain-gnta.webp',
        titleKa: 'გერგეტის სამება',
        titleEn: 'Gergeti Trinity Church',
        locationKa: 'ყაზბეგი',
        locationEn: 'Kazbegi',
        descKa: 'XIV საუკუნის ეკლესია 2170 მეტრის სიმაღლეზე, ყაზბეგის მთის ფონზე. საქართველოს ყველაზე ფოტოგენური და იკონური სანახაობა, რომელიც ყველა ტურისტის ნახვის სიაშია.',
        descEn: 'A 14th-century church perched at 2,170 meters with Mount Kazbek as its backdrop. Georgia\'s most photogenic and iconic sight, on every traveler\'s must-see list.',
    },
    {
        img: 'https://storage.georgia.travel/images/sataplia-cave-and-nature-reserve-gnta.webp',
        titleKa: 'სათაფლიის მღვიმე',
        titleEn: 'Sataplia Cave',
        locationKa: 'ქუთაისი',
        locationEn: 'Kutaisi',
        descKa: 'ნაკრძალი, სადაც დინოზავრების ნაკვალევი, სტალაქტიტები და გამჭვირვალე ხიდი გხვდება. ბუნების მოყვარულთა და ოჯახებისთვის იდეალური მიმართულება ქუთაისთან ახლოს.',
        descEn: 'A reserve with dinosaur footprints, stalactites, and a glass walkway. An ideal destination for nature lovers and families, located near Kutaisi.',
    },
];

export default function Sights({ language }: { language: Language }) {
    const isKa = language === 'ka';

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
                            : 'Georgia\'s most impressive must-see landmarks'}
                    </p>
                </div>
            </section>

            {/* Sights Grid */}
            <section className="py-20 bg-background-light">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {sights.map((item, i) => (
                            <div key={i} className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col sm:flex-row">
                                <div className="relative sm:w-56 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                                    <img
                                        src={item.img}
                                        alt={isKa ? item.titleKa : item.titleEn}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                </div>
                                <div className="p-6 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                                        <span className="text-xs font-bold text-primary uppercase tracking-wider">{isKa ? item.locationKa : item.locationEn}</span>
                                    </div>
                                    <h2 className="text-xl font-black text-text-main leading-tight mb-2">{isKa ? item.titleKa : item.titleEn}</h2>
                                    <p className="text-text-muted text-sm leading-relaxed">
                                        {isKa ? item.descKa : item.descEn}
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
