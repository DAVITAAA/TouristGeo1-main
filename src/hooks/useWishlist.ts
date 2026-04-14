import { useState, useEffect } from 'react';
import { Tour } from '../api';

export function useWishlist(isAuthenticated: boolean = false) {
    const [wishlist, setWishlist] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('travel_georgia_wishlist');
            if (saved) {
                try {
                    const items = JSON.parse(saved);
                    const now = Date.now();
                    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
                    
                    // Filter logic
                    const validItems = items.filter((item: any) => {
                        if (isAuthenticated) return true; // keep all if logged in
                        if (!item.savedAt) return true; // safely keep older items
                        return (now - item.savedAt) <= SEVEN_DAYS;
                    });
                    
                    if (validItems.length !== items.length) {
                        localStorage.setItem('travel_georgia_wishlist', JSON.stringify(validItems));
                    }
                    return validItems;
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
                return [...prev, { ...tour, savedAt: Date.now() }];
            }
        });
    };

    const isInWishlist = (tourId: number) => {
        return wishlist.some((t) => t.id === tourId);
    };

    return { wishlist, toggleWishlist, isInWishlist };
}
