import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Static fallback exchange rates base on USD
let cachedRates: any = {
    USD: 1,
    EUR: 0.92,
    GEL: 2.65,
};

let fetchPromise: Promise<void> | null = null;
const currencyListeners = new Set<() => void>();

export type CurrencyOption = 'USD' | 'EUR' | 'GEL';

interface CurrencyContextType {
    currency: CurrencyOption;
    setCurrency: (c: CurrencyOption) => void;
    convertPrice: (basePriceUsd: number) => number;
    getCurrencySymbol: () => string;
    rates: any;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [rates, setRates] = useState(cachedRates);
    const [currency, setCurrency] = useState<CurrencyOption>(() => {
        return (localStorage.getItem('touristgeo_currency') as CurrencyOption) || 'USD';
    });

    useEffect(() => {
        localStorage.setItem('touristgeo_currency', currency);
    }, [currency]);

    useEffect(() => {
        const handler = () => setRates({ ...cachedRates });
        currencyListeners.add(handler);

        if (!fetchPromise) {
            fetchPromise = fetch('https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json')
                .then(res => res.json())
                .then(data => {
                    const currencies = data[0].currencies;
                    const usdData = currencies.find((c: any) => c.code === 'USD');
                    const eurData = currencies.find((c: any) => c.code === 'EUR');
                    if (usdData && eurData) {
                        const usdRate = usdData.rate / usdData.quantity; 
                        const eurRate = eurData.rate / eurData.quantity; 
                        cachedRates = {
                            USD: 1,
                            GEL: usdRate,
                            EUR: usdRate / eurRate
                        };
                        currencyListeners.forEach(fn => fn());
                    }
                })
                .catch(err => console.error("Failed to fetch NBG rates", err));
        }
        return () => { currencyListeners.delete(handler); };
    }, []);

    const convertPrice = (basePriceUsd: number) => {
        const rate = cachedRates[currency] || 1;
        return Number((basePriceUsd * rate).toFixed(2));
    };

    const getCurrencySymbol = () => {
        switch (currency) {
            case 'EUR': return '€';
            case 'GEL': return '₾';
            case 'USD':
            default: return '$';
        }
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, getCurrencySymbol, rates }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
