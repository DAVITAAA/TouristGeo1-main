import { useEffect, useState } from 'react';
import { fetchTours, fetchCategories, Tour } from '../api';
import TourCard from '../components/TourCard';
import { translations, Language } from '../translations';

export default function Search({ onNavigate, language }: { onNavigate: (page: string) => void, language: Language }) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const t = translations[language];

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTours(selectedCategory, searchTerm)
      .then(setTours)
      .finally(() => setLoading(false));
  }, [selectedCategory, searchTerm]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-black text-text-main">მოძებნე შენი ტური</h1>
        <p className="text-text-muted text-lg mt-2 font-medium">იპოვე საუკეთესო შეთავაზებები შენი ინტერესების მიხედვით</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-1/4">
          <div className="bg-white rounded-3xl p-8 border border-border-light shadow-xl shadow-black/5 sticky top-24 transform transition-all hover:shadow-2xl">
            <div className="mb-8">
              <h3 className="font-black text-text-main mb-4 flex items-center gap-2 text-lg">
                <span className="material-symbols-outlined text-primary font-bold">search</span>
                ძიება
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ტური ან ადგილმდებარეობა..."
                  className="w-full h-12 rounded-xl border border-border-light bg-background-light pl-4 pr-10 text-sm font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">explore</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-black text-text-main mb-4 flex items-center gap-2 text-lg">
                <span className="material-symbols-outlined text-primary font-bold">category</span>
                კატეგორიები
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedCategory === '' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'bg-background-light text-text-muted hover:bg-gray-200'}`}
                >
                  ყველა
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedCategory === cat ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'bg-background-light text-text-muted hover:bg-gray-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
              className="w-full py-4 text-sm font-black text-white bg-text-main rounded-2xl hover:bg-primary hover:text-primary-content transition-all shadow-lg active:scale-95"
            >
              ფილტრების გასუფთავება
            </button>
          </div>
        </aside>

        {/* Results */}
        <div className="w-full lg:w-3/4">
          <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-2xl border border-border-light shadow-sm">
            <span className="text-sm font-black text-text-muted px-4">ნაპოვნია {tours.length} ტური</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">დალაგება:</span>
              <select className="h-10 rounded-xl border-0 bg-background-light px-4 text-xs font-black focus:ring-2 focus:ring-primary/20 outline-none">
                <option>პოპულარული</option>
                <option>ფასი: ზრდადი</option>
                <option>ფასი: კლებადი</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-[32px]"></div>)}
            </div>
          ) : tours.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {tours.map(tour => (
                <TourCard key={tour.id} tour={tour} onNavigate={onNavigate} language={language} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[40px] border border-border-light p-20 text-center flex flex-col items-center justify-center shadow-2xl shadow-black/5">
              <div className="w-24 h-24 bg-background-light rounded-3xl flex items-center justify-center text-primary mb-8 rotate-12">
                <span className="material-symbols-outlined text-5xl font-bold">search_off</span>
              </div>
              <h3 className="text-2xl font-black text-text-main mb-4">ტურები ვერ მოიძებნა</h3>
              <p className="text-text-muted max-w-sm mx-auto font-medium leading-relaxed">თქვენი ფილტრების მიხედვით ტურები არ მოიძებნა. სცადეთ შეცვალოთ ფილტრები.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
                className="mt-10 px-10 py-4 bg-primary text-primary-content font-black rounded-2xl hover:bg-text-main hover:text-white transition-all shadow-xl shadow-primary/20 transform active:scale-95"
              >
                ყველა ტურის ნახვა
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
