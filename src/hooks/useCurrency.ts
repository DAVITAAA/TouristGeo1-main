import { useState, useEffect } from 'react';

// Static fallback exchange rates base on USD
let cachedRates = {
    USD: 1,
    EUR: 0.92,
    GEL: 2.65,
};

let fetchPromise: Promise<void> | null = null;

export type CurrencyOption = 'USD' | 'EUR' | 'GEL';

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
    
    const [rates, setRates] = useState(cachedRates);

    useEffect(() => {
        localStorage.setItem('travel_georgia_currency', currency);
    }, [currency]);

    useEffect(() => {
        let isMounted = true;
        if (!fetchPromise) {
            fetchPromise = fetch('https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json')
                .then(res => res.json())
                .then(data => {
                    const currencies = data[0].currencies;
                    const usdData = currencies.find((c: any) => c.code === 'USD');
                    const eurData = currencies.find((c: any) => c.code === 'EUR');
                    if (usdData && eurData) {
                        const usdRate = usdData.rate / usdData.quantity; // rate of 1 USD in GEL
                        const eurRate = eurData.rate / eurData.quantity; // rate of 1 EUR in GEL
                        cachedRates = {
                            USD: 1,
                            GEL: usdRate,
                            EUR: usdRate / eurRate
                        };
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch NBG rates", err);
                });
        }
        fetchPromise.then(() => {
            if (isMounted) setRates({ ...cachedRates });
        });
        return () => { isMounted = false; };
    }, []);

    // Convert a base price (assumed to be in USD in DB/API)
    const convertPrice = (basePriceUsd: number, targetCurrency: CurrencyOption = currency) => {
        const rate = rates[targetCurrency] || 1;
        
        // Return 2 decimal places exactly for better precision when converting
        return Number((basePriceUsd * rate).toFixed(2));
    };

    const getCurrencySymbol = (targetCurrency: CurrencyOption = currency) => {
        switch (targetCurrency) {
            case 'EUR': return '€';
            case 'GEL': return '₾';
            case 'USD':
            default: return '$';
        }
    }

    return { currency, setCurrency, convertPrice, getCurrencySymbol, rates };
}
