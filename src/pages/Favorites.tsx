// React 19 does not require explicit React import for JSX
import { translations, Language } from '../translations';
import { useWishlist } from '../hooks/useWishlist';
import TourCard from '../components/TourCard';

interface FavoritesProps {
    onNavigate: (page: string, data?: any) => void;
    language: Language;
}

export default function Favorites({ onNavigate, language }: FavoritesProps) {
    const t = translations[language];
    const isKa = language === 'ka';
    const { wishlist } = useWishlist();

    return (
        <div className="min-h-screen bg-background-light py-12 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-text-main mb-4">
                        {isKa ? 'შენი რჩეული ტურები' : 'Your Favorite Tours'}
                    </h1>
                    <p className="text-text-muted text-base max-w-2xl mx-auto">
                        {isKa
                            ? 'აქ ინახება ყველა ის ტური, რომელიც მოგეწონა. დაგეგმე შენი შემდეგი თავგადასავალი მარტივად.'
                            : 'Here are all the tours you liked. Plan your next adventure easily.'}
                    </p>
                </div>

                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((tour) => (
                            <TourCard key={tour.id} tour={tour} onNavigate={onNavigate} language={language} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-border-light shadow-sm">
                        <div className="w-20 h-20 bg-background-light rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-gray-400">favorite_border</span>
                        </div>
                        <h3 className="text-xl font-bold text-text-main mb-2">
                            {isKa ? 'სია ცარიელია' : 'Wishlist is empty'}
                        </h3>
                        <p className="text-text-muted mb-8 max-w-sm mx-auto">
                            {isKa
                                ? 'ჯერ არცერთი ტური არ დაგიმატებია რჩეულებში. დაათვალიერე ტურები და მონიშნე გულის ღილაკით.'
                                : 'You haven\'t added any tours to your wishlist yet. Browse tours and click the heart icon to save them.'}
                        </p>
                        <button
                            onClick={() => onNavigate('search')}
                            className="pulse-cta px-8 py-3 bg-primary text-primary-content font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto"
                        >
                            <span className="material-symbols-outlined text-[18px]">search</span>
                            {isKa ? 'ტურების ძიება' : 'Search Tours'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
