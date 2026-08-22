import { useState, useEffect } from 'react';
import { Tour } from '../api';

let memoryWishlist: any[] | null = null;
const wishlistListeners = new Set<() => void>();

function getInitialWishlist(isAuthenticated: boolean) {
    if (memoryWishlist !== null) return memoryWishlist;
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('travel_georgia_wishlist');
        if (saved) {
            try {
                const items = JSON.parse(saved);
                const now = Date.now();
                const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
                
                const validItems = items.filter((item: any) => {
                    if (isAuthenticated) return true;
                    if (!item.savedAt) return true;
                    return (now - item.savedAt) <= SEVEN_DAYS;
                });
                
                memoryWishlist = validItems;
                return validItems;
            } catch (e) {
                console.error('Failed to parse wishlist', e);
            }
        }
    }
    memoryWishlist = [];
    return memoryWishlist;
}

export function useWishlist(isAuthenticated: boolean = false) {
    const [wishlist, setWishlist] = useState<any[]>(() => getInitialWishlist(isAuthenticated));

    useEffect(() => {
        const handler = () => {
            if (memoryWishlist) setWishlist([...memoryWishlist]);
        };
        wishlistListeners.add(handler);
        return () => { wishlistListeners.delete(handler); };
    }, []);

    const toggleWishlist = (tour: Tour) => {
        const current = memoryWishlist || [];
        const isSaved = current.some((t) => t.id === tour.id);
        const updated = isSaved
            ? current.filter((t) => t.id !== tour.id)
            : [...current, { ...tour, savedAt: Date.now() }];
        
        memoryWishlist = updated;
        if (typeof window !== 'undefined') {
            localStorage.setItem('travel_georgia_wishlist', JSON.stringify(updated));
        }
        wishlistListeners.forEach(fn => fn());
    };

    const isInWishlist = (tourId: number) => {
        return (memoryWishlist || wishlist).some((t) => t.id === tourId);
    };

    return { wishlist: memoryWishlist || wishlist, toggleWishlist, isInWishlist };
}
