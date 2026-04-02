import { useState, useEffect } from 'react';
import { Tour } from '../api';

export function useWishlist() {
    const [wishlist, setWishlist] = useState<Tour[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('travel_georgia_wishlist');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to parse wishlist', e);
                }
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('travel_georgia_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const toggleWishlist = (tour: Tour) => {
        setWishlist((prev) => {
            const isSaved = prev.some((t) => t.id === tour.id);
            if (isSaved) {
                return prev.filter((t) => t.id !== tour.id);
            } else {
                return [...prev, tour];
            }
        });
    };

    const isInWishlist = (tourId: number) => {
        return wishlist.some((t) => t.id === tourId);
    };

    return { wishlist, toggleWishlist, isInWishlist };
}
