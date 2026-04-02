import { useState, useEffect } from 'react';
import { Tour } from '../api';

export function useRecentlyViewed() {
    const [recentlyViewed, setRecentlyViewed] = useState<Tour[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('travel_georgia_recently_viewed');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to parse recently viewed', e);
                }
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('travel_georgia_recently_viewed', JSON.stringify(recentlyViewed));
    }, [recentlyViewed]);

    const addRecentlyViewed = (tour: Tour) => {
        setRecentlyViewed((prev) => {
            // Remove it if it already exists to place it at the front
            const filtered = prev.filter((t) => t.id !== tour.id);
            return [tour, ...filtered].slice(0, 10); // Keep max 10
        });
    };

    return { recentlyViewed, addRecentlyViewed };
}
