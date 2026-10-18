import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tour } from '../api';
import { useToast } from './ToastContext';

interface TourCompareContextType {
  compareList: Tour[];
  addToCompare: (tour: Tour) => boolean;
  removeFromCompare: (tourId: number) => void;
  toggleCompare: (tour: Tour) => void;
  isInCompare: (tourId: number) => boolean;
  clearCompare: () => void;
  isCompareModalOpen: boolean;
  openCompareModal: () => void;
  closeCompareModal: () => void;
}

const TourCompareContext = createContext<TourCompareContextType | undefined>(undefined);

const STORAGE_KEY = 'touristgeo_compare_list';
const MAX_COMPARE = 3;

export function TourCompareProvider({ children, language = 'ka' }: { children: ReactNode; language?: 'ka' | 'en' }) {
  const [compareList, setCompareList] = useState<Tour[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const { showToast } = useToast();
  const isKa = language === 'ka';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
    } catch (e) {
      console.error('Failed to save compare list', e);
    }
  }, [compareList]);

  const isInCompare = (tourId: number) => {
    return compareList.some((t) => t.id === tourId);
  };

  const addToCompare = (tour: Tour): boolean => {
    if (isInCompare(tour.id)) {
      showToast(isKa ? 'ტური უკვე დამატებულია შედარებაში' : 'Tour is already in comparison', 'info');
      return false;
    }

    if (compareList.length >= MAX_COMPARE) {
      showToast(
        isKa ? `შედარებაში შესაძლებელია მაქსიმუმ ${MAX_COMPARE} ტურის დამატება` : `You can compare up to ${MAX_COMPARE} tours at once`,
        'info'
      );
      return false;
    }

    setCompareList((prev) => [...prev, tour]);
    showToast(isKa ? 'ტური დაემატა შედარებაში' : 'Tour added to comparison', 'success');
    return true;
  };

  const removeFromCompare = (tourId: number) => {
    setCompareList((prev) => prev.filter((t) => t.id !== tourId));
    showToast(isKa ? 'ტური ამოიშალა შედარებიდან' : 'Tour removed from comparison', 'info');
  };

  const toggleCompare = (tour: Tour) => {
    if (isInCompare(tour.id)) {
      removeFromCompare(tour.id);
    } else {
      addToCompare(tour);
    }
  };

  const clearCompare = () => {
    setCompareList([]);
    setIsCompareModalOpen(false);
    showToast(isKa ? 'შედარების სია გასუფთავდა' : 'Comparison list cleared', 'info');
  };

  const openCompareModal = () => {
    if (compareList.length < 2) {
      showToast(
        isKa ? 'შესადარებლად აირჩიეთ მინიმუმ 2 ტური' : 'Please select at least 2 tours to compare',
        'info'
      );
      return;
    }
    setIsCompareModalOpen(true);
  };

  const closeCompareModal = () => {
    setIsCompareModalOpen(false);
  };

  return (
    <TourCompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        toggleCompare,
        isInCompare,
        clearCompare,
        isCompareModalOpen,
        openCompareModal,
        closeCompareModal,
      }}
    >
      {children}
    </TourCompareContext.Provider>
  );
}

export function useTourCompare() {
  const context = useContext(TourCompareContext);
  if (!context) {
    throw new Error('useTourCompare must be used within a TourCompareProvider');
  }
  return context;
}
