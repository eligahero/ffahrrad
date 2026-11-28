'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  formatPriceNumber,
  formatPriceWithTax,
  CurrencyOptions,
  CurrencyCode,
  CurrencyDefinition,
  SUPPORTED_CURRENCIES,
  defaultCurrencyOptions,
} from '@/lib/formatPrice';

interface CurrencyContextType {
  options: CurrencyOptions;
  selectedCurrency: CurrencyCode;
  currencyDefinition: CurrencyDefinition;
  setCurrency: (code: CurrencyCode) => void;
  currencies: CurrencyDefinition[];
  formatPrice: (amount: number) => string;
  formatPriceWithTax: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  options: defaultCurrencyOptions,
  selectedCurrency: 'EUR',
  currencyDefinition: SUPPORTED_CURRENCIES.EUR,
  setCurrency: () => {},
  currencies: Object.values(SUPPORTED_CURRENCIES),
  formatPrice: (amount: number) => formatPriceNumber(amount, defaultCurrencyOptions),
  formatPriceWithTax: (amount: number) => formatPriceWithTax(amount, defaultCurrencyOptions),
});

export const useCurrency = () => useContext(CurrencyContext);

export default function CurrencyProvider({
  children,
  options: initialOptions,
}: {
  children: ReactNode;
  options: CurrencyOptions;
}) {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('EUR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('ffahrrad_currency') as CurrencyCode | null;
      if (saved && SUPPORTED_CURRENCIES[saved]) {
        setCurrencyCode(saved);
      }
    } catch {
      // ignore localStorage errors in private mode
    }
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    if (SUPPORTED_CURRENCIES[code]) {
      setCurrencyCode(code);
      try {
        localStorage.setItem('ffahrrad_currency', code);
      } catch {
        // ignore
      }
    }
  };

  const currentDefinition = useMemo(() => {
    return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.EUR;
  }, [currencyCode]);

  const activeOptions: CurrencyOptions = useMemo(() => {
    return {
      ...initialOptions,
      currencySymbol: currentDefinition.symbol,
      currencyPosition: currentDefinition.position,
      thousandSeparator: currentDefinition.thousandSeparator,
      decimalSeparator: currentDefinition.decimalSeparator,
      rate: currentDefinition.rate,
      decimals: currentDefinition.decimals,
      code: currentDefinition.code,
    };
  }, [initialOptions, currentDefinition]);

  const formatPriceFn = (amount: number) => formatPriceNumber(amount, activeOptions);
  const formatPriceWithTaxFn = (amount: number) => formatPriceWithTax(amount, activeOptions);

  return (
    <CurrencyContext.Provider
      value={{
        options: activeOptions,
        selectedCurrency: currencyCode,
        currencyDefinition: currentDefinition,
        setCurrency,
        currencies: Object.values(SUPPORTED_CURRENCIES),
        formatPrice: formatPriceFn,
        formatPriceWithTax: formatPriceWithTaxFn,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
