import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const CurrencyContext = createContext();

const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD'];

const CURRENCY_SYMBOLS = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'CA$',
    AUD: 'A$'
};

const API_URL = `https://v6.exchangerate-api.com/v6/${import.meta.env.VITE_CURRENCY_API_KEY}/latest/NGN`;

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrencyState] = useState(() => {
        return localStorage.getItem('jm_currency') || 'NGN';
    });
    const [rates, setRates] = useState({ NGN: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        const fetchRates = async () => {
            try {
                // Check if we have valid cached rates to prevent unnecessary API calls
                const cachedRates = sessionStorage.getItem('jm_exchange_rates');
                const cachedTime = sessionStorage.getItem('jm_exchange_rates_time');
                
                // Cache for 24 hours
                if (cachedRates && cachedTime && (Date.now() - parseInt(cachedTime, 10)) < 86400000) {
                    if (isMounted) {
                        setRates(JSON.parse(cachedRates));
                        setLoading(false);
                    }
                    return;
                }

                const response = await fetch(API_URL);
                const data = await response.json();
                
                if (data.result === 'success') {
                    if (isMounted) {
                        setRates(data.conversion_rates);
                        setLoading(false);
                        sessionStorage.setItem('jm_exchange_rates', JSON.stringify(data.conversion_rates));
                        sessionStorage.setItem('jm_exchange_rates_time', Date.now().toString());
                    }
                } else {
                    console.error('Failed to fetch exchange rates:', data['error-type']);
                    if (isMounted) setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
                if (isMounted) setLoading(false);
            }
        };

        fetchRates();

        return () => {
            isMounted = false;
        };
    }, []);

    const setCurrency = useCallback((newCurrency) => {
        if (SUPPORTED_CURRENCIES.includes(newCurrency)) {
            setCurrencyState(newCurrency);
            localStorage.setItem('jm_currency', newCurrency);
        }
    }, []);

    const formatPrice = useCallback((priceInNGN) => {
        if (!priceInNGN && priceInNGN !== 0) return '';
        
        let cleanedPrice = priceInNGN;
        if (typeof cleanedPrice === 'string') {
            cleanedPrice = cleanedPrice.replace(/[^0-9.-]+/g, '');
        }
        
        const numericPrice = Number(cleanedPrice);
        if (isNaN(numericPrice)) return priceInNGN;

        // If rates haven't loaded yet, or if it's NGN, just return formatted NGN
        if (currency === 'NGN' || !rates[currency]) {
            return `${CURRENCY_SYMBOLS['NGN']}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericPrice)}`;
        }

        const convertedPrice = numericPrice * rates[currency];
        const symbol = CURRENCY_SYMBOLS[currency] || currency;
        
        return `${symbol}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convertedPrice)}`;
    }, [currency, rates]);

    const value = useMemo(() => ({
        currency,
        setCurrency,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        formatPrice,
        loading
    }), [currency, setCurrency, formatPrice, loading]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
