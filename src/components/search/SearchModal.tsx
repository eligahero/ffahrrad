'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { searchProducts } from '@/actions/public';
import Price from '@/components/Price';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS = [
  'E-Bikes 625 Wh',
  'Cube Aim ONE',
  'Mountainbike Fully',
  'Gravel Bike',
  'KTM Macina',
  'Trekkingrad',
  'Kinderanhänger',
  'Bosch Smart System',
  'Shimano Deore',
];

const CATEGORY_CARDS = [
  { label: 'E-Bikes & Pedelecs', href: '/shop?category=e-bike' },
  { label: 'Mountainbikes (MTB)', href: '/shop?category=mountainbike' },
  { label: 'Gravel & Rennräder', href: '/shop?category=gravel' },
  { label: 'Fahrradanhänger', href: '/shop?category=anhaenger' },
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input and lock body scroll when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length > 1) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const prods = await searchProducts(query, 'all', 6);
          setResults(prods);
        } catch {
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="bg-[#0D1826]/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl text-white relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Search Input Bar */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-[#132235] border border-white/10 focus-within:border-[#F59E0B] rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-colors shadow-inner">
            <svg className="w-5 h-5 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Fahrräder, E-Bikes, Marken oder Zubehör suchen..."
              className="text-white placeholder-stone-400 text-sm sm:text-base outline-none flex-1 bg-transparent"
            />

            {/* Clear Button if query exists */}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-stone-400 hover:text-white p-1 text-xs"
                title="Löschen"
              >
                ✕
              </button>
            )}

            {/* Escape / Close Badge */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer select-none shrink-0"
            >
              <span>Échap</span>
              <span className="text-[10px] opacity-75">✕</span>
            </button>
          </div>
        </form>

        {/* 2. Results OR Suggestions View */}
        {query.trim().length > 1 ? (
          /* Live Search Results */
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3 text-xs text-stone-400 font-semibold uppercase tracking-wider">
              <span>Suchergebnisse ({results.length})</span>
              {isSearching && (
                <div className="flex items-center gap-1.5 text-[#F59E0B]">
                  <div className="w-3 h-3 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px]">Suchen...</span>
                </div>
              )}
            </div>

            {results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/produto/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-[#132235]/60 hover:bg-[#1A2E46] border border-white/5 hover:border-[#F59E0B]/40 transition group"
                  >
                    <div className="w-12 h-12 bg-[#0B131E] rounded-xl p-1.5 shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                      {product.images && product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          width={60}
                          height={60}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-xl">🚲</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#F59E0B] truncate transition-colors">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Price amount={product.price} showTax={false} className="text-[#F59E0B] font-bold text-xs" />
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <Price amount={product.compareAtPrice} showTax={false} className="text-stone-500 line-through text-[11px]" />
                        )}
                      </div>
                    </div>
                    <span className="text-stone-400 group-hover:text-[#F59E0B] group-hover:translate-x-1 transition-transform text-xs font-bold pr-2">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            ) : !isSearching ? (
              <div className="p-8 text-center text-sm text-stone-400 bg-[#132235]/40 rounded-2xl">
                Keine Fahrräder gefunden für &ldquo;<span className="text-white font-semibold">{query}</span>&rdquo;
              </div>
            ) : null}
          </div>
        ) : (
          /* Default Suggestions & Category Explorer (Matching capture media_1795856508092_f95bc268.jpg) */
          <>
            {/* Quick Suggestions Tags */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3 text-[11px] font-bold tracking-wider uppercase">
                <span className="text-stone-400">Recherches rapides suggérées</span>
                <span className="text-[#F59E0B]">Beliebte Modelle</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(tag)}
                    className="px-3.5 py-1.5 rounded-full bg-[#142337] hover:bg-[#1D324F] hover:border-[#F59E0B]/50 border border-white/10 text-stone-200 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 select-none"
                  >
                    <span className="text-[11px] opacity-60">↗</span>
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Browse by Category Cards */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="mb-3 text-[11px] font-bold tracking-wider uppercase text-stone-400">
                Parcourir par catégorie
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORY_CARDS.map((cat, idx) => (
                  <Link
                    key={idx}
                    href={cat.href}
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#142337] hover:bg-[#1D324F] border border-white/10 hover:border-[#F59E0B]/50 transition text-xs sm:text-sm font-semibold text-white group cursor-pointer"
                  >
                    <span>{cat.label}</span>
                    <span className="text-stone-400 group-hover:text-[#F59E0B] group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
