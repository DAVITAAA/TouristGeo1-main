import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { translations, Language } from '../translations';
import { fetchTours, Tour } from '../api';
import TourCard from '../components/TourCard';

interface OperatorProps {
  onNavigate: (page: string, data?: any) => void;
  language: Language;
  operator: { id: string; name: string } | null;
}

export default function Operator({ onNavigate, language, operator }: OperatorProps) {
  const t = translations[language];
  const isKa = language === 'ka';
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!operator?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchTours();
        // Filter by operator id
        const operatorTours = data.filter(tour => 
          tour.operator_id === operator.id || tour.operator === operator.id
        );
        setTours(operatorTours);
      } catch (error) {
        console.error('Failed to fetch operator tours:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [operator]);

  if (!operator) {
    return (
      <div className="min-h-screen pt-32 pb-20 text-center">
        <p className="text-text-muted font-bold">Operator not found.</p>
        <button onClick={() => onNavigate('home')} className="mt-4 text-primary font-bold hover:underline">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 mb-10 shadow-sm border border-border-light flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-white mb-4 shadow-md">
            <span className="material-symbols-outlined text-4xl">account_circle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main mb-2">{operator.name}</h1>
          <p className="text-sm font-bold text-text-muted uppercase tracking-widest">{t.tour_provided_by}</p>
        </div>

        {/* Content */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-text-main">
            {isKa ? 'ოპერატორის ტურები' : 'Operator Tours'}
            <span className="ml-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg">{tours.length}</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-border-light border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : tours.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tours.map(tour => (
              <TourCard
                key={tour.id}
                tour={tour}
                onNavigate={onNavigate}
                language={language}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-border-light border-dashed">
            <div className="w-20 h-20 bg-background-light rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-text-muted">landscape</span>
            </div>
            <h3 className="text-xl font-black text-text-main mb-3">
              {isKa ? 'ტურები არ მოიძებნა' : 'No tours found'}
            </h3>
            <p className="text-text-muted font-medium max-w-sm mx-auto">
              {isKa ? 'ამ ოპერატორს ჯერ არ აქვს დამატებული ტურები.' : 'This operator hasn\'t listed any tours yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
