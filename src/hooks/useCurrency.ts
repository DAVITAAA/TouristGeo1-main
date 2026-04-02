import { useState, useEffect } from 'react';

// Simplified static exchange rates base on USD
const EXCHANGE_RATES = {
    USD: 1,
    EUR: 0.92,
    GEL: 2.65,
};

type CurrencyOption = 'USD' | 'EUR' | 'GEL';

export function useCurrency() {
    const [currency, setCurrency] = useState<CurrencyOption>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('travel_georgia_currency');
            if (saved && ['USD', 'EUR', 'GEL'].includes(saved)) {
                return saved as CurrencyOption;
            }
        }
        return 'USD';
    });

    useEffect(() => {
        localStorage.setItem('travel_georgia_currency', currency);
    }, [currency]);

    // Convert a base price (assumed to be in USD in DB/API)
    const convertPrice = (basePriceUsd: number) => {
        const rate = EXCHANGE_RATES[currency];
        return Math.round(basePriceUsd * rate);
    };

    const getCurrencySymbol = () => {
        switch (currency) {
            case 'EUR': return '€';
            case 'GEL': return '₾';
            case 'USD':
            default: return '$';
        }
    }

    return { currency, setCurrency, convertPrice, getCurrencySymbol };
}
