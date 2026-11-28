'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/components/CurrencyProvider';
import { CurrencyCode } from '@/lib/formatPrice';

export default function CurrencySelector() {
  const { selectedCurrency, currencyDefinition, setCurrency, currencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Active Currency Capsule Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Währung auswählen"
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#0F1B2A]/90 hover:bg-[#1A2E44] border border-white/15 text-white text-xs font-bold transition shadow-sm cursor-pointer select-none"
      >
        <span className="text-sm leading-none">{currencyDefinition.flag}</span>
        <span className="tracking-wider">{currencyDefinition.code}</span>
        <svg
          className={`w-3 h-3 text-stone-300 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Currency Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0B131E]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl py-2 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-400 border-b border-white/10">
            Währung wählen
          </div>
          <div className="p-1 space-y-0.5">
            {currencies.map((curr) => {
              const isSelected = curr.code === selectedCurrency;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => {
                    setCurrency(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#F59E0B] text-stone-950 font-bold shadow-sm'
                      : 'hover:bg-white/10 text-stone-200 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{curr.flag}</span>
                    <span>{curr.code}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                      ({curr.symbol})
                    </span>
                  </div>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-stone-950 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
