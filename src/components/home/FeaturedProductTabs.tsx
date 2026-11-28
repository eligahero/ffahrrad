'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import Price from '@/components/Price';
import curatedBicyclesData from '@/data/curatedBicycles.json';

export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  discountLabel?: string | null;
  categorySlug?: string;
  categoryName?: string;
  allCategories?: string;
  categories?: { name: string; slug: string }[];
}

interface FeaturedProductTabsProps {
  initialProducts?: ProductItem[];
}

const fallbackBicycles: ProductItem[] = curatedBicyclesData as ProductItem[];

interface TabDefinition {
  id: string;
  label: string;
  viewAllLabel: string;
  viewAllHref: string;
}

const TABS: TabDefinition[] = [
  {
    id: 'all',
    label: 'Alle Fahrräder',
    viewAllLabel: 'Mehr Fahrräder ansehen',
    viewAllHref: '/shop',
  },
  {
    id: 'ebike',
    label: '⚡ E-Bikes',
    viewAllLabel: 'Alle E-Bikes ansehen',
    viewAllHref: '/shop?category=e-bike',
  },
  {
    id: 'mtb',
    label: '🚵 Mountainbikes',
    viewAllLabel: 'Alle Mountainbikes ansehen',
    viewAllHref: '/shop?category=mountainbike',
  },
  {
    id: 'gravel',
    label: '🚴 Gravel & Road',
    viewAllLabel: 'Alle Gravel- & Rennräder ansehen',
    viewAllHref: '/shop?category=gravel',
  },
  {
    id: 'trekking',
    label: '🏙️ Trekking & City',
    viewAllLabel: 'Alle Trekking- & Cityräder ansehen',
    viewAllHref: '/shop?category=trekking',
  },
  {
    id: 'cargo',
    label: '🛒 Anhänger & Cargo',
    viewAllLabel: 'Alle Anhänger & Lastenräder ansehen',
    viewAllHref: '/shop?category=cargo',
  },
];

function classifyProduct(p: ProductItem): 'ebike' | 'mtb' | 'gravel' | 'trekking' | 'cargo' | 'other' {
  if (p.categorySlug === 'cargo' || p.categorySlug === 'mtb' || p.categorySlug === 'gravel' || p.categorySlug === 'trekking' || p.categorySlug === 'ebike') {
    return p.categorySlug;
  }

  const t = ((p.title || '') + ' ' + (p.slug || '') + ' ' + (p.categoryName || '') + ' ' + (p.allCategories || '')).toLowerCase();

  if (t.includes('croozer') || t.includes('cargo') || t.includes('anhänger') || t.includes('kalle') || t.includes('long john') || t.includes('dreirad') || t.includes('trike')) {
    return 'cargo';
  }
  if (t.includes('aim') || t.includes('mountainbike') || t.includes('mtb') || t.includes('hardtail') || t.includes('fully') || t.includes('reaction')) {
    return 'mtb';
  }
  if (t.includes('gravel') || t.includes('rennrad') || t.includes('cross') || t.includes('road')) {
    return 'gravel';
  }
  if (t.includes('trekking') || t.includes('city') || t.includes('tour') || t.includes('tiefeinsteiger') || t.includes('trapez') || t.includes('diamant')) {
    return 'trekking';
  }
  if (t.includes('e-bike') || t.includes('macina') || t.includes('wh') || t.includes('bosch') || t.includes('hybrid') || t.includes('pedelec')) {
    return 'ebike';
  }

  return 'other';
}

export default function FeaturedProductTabs({ initialProducts }: FeaturedProductTabsProps) {
  const [activeTab, setActiveTab] = useState('all');
  const sliderRef = useRef<HTMLDivElement>(null);
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();

  // Combine initial products with curated catalog fallbacks
  const allProducts: ProductItem[] = useMemo(() => {
    if (initialProducts && initialProducts.length >= 12) {
      return initialProducts;
    }
    const combined = [...(initialProducts || [])];
    const seenIds = new Set(combined.map((p) => p.id || p.slug));
    for (const b of fallbackBicycles) {
      if (!seenIds.has(b.id) && !seenIds.has(b.slug)) {
        combined.push(b);
        seenIds.add(b.id);
      }
    }
    return combined;
  }, [initialProducts]);

  // Active tab definition
  const currentTabDef = useMemo(() => {
    return TABS.find((t) => t.id === activeTab) || TABS[0];
  }, [activeTab]);

  // Filter products for active tab
  const displayedProducts = useMemo(() => {
    if (activeTab === 'all') {
      // For Alle Fahrräder: show 8 products
      return allProducts.slice(0, 8);
    }
    // For specific category: filter by classification, minimum 4 items guaranteed
    const filtered = allProducts.filter((p) => classifyProduct(p) === activeTab);
    if (filtered.length >= 4) {
      return filtered;
    }
    // Fallback: take from curated fallback for that category
    const fallbacksForCat = fallbackBicycles.filter((b) => b.categorySlug === activeTab);
    const combined = [...filtered];
    const seen = new Set(combined.map((p) => p.id));
    for (const fb of fallbacksForCat) {
      if (!seen.has(fb.id)) {
        combined.push(fb);
        seen.add(fb.id);
      }
    }
    return combined;
  }, [allProducts, activeTab]);

  const hasSlideNavigation = displayedProducts.length > 4;

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const cardWidth = sliderRef.current.clientWidth / (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1);
      const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (e: React.MouseEvent, prod: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    cartStore.addItem({
      id: prod.id,
      productId: prod.id,
      title: prod.title,
      price: prod.price,
      image: prod.images && prod.images[0] ? prod.images[0] : '',
      quantity: 1,
    });
    cartStore.setIsOpen(true);
  };

  const handleToggleWishlist = (e: React.MouseEvent, prod: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    wishlistStore.toggleItem(prod.id);
  };

  return (
    <section className="py-14 sm:py-20 bg-stone-50/60 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Header (Matching media_1795862608033_ec74ba4c.png) */}
        <div className="mb-8 sm:mb-10">
          <span className="text-[#F28611] font-extrabold text-xs sm:text-sm uppercase tracking-wider block mb-1">
            TOP-ANGEBOTE &amp; BESTSELLER
          </span>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-stone-900 tracking-tight leading-tight">
              Ausgewählte Fahrräder &amp; E-Bikes
            </h2>

            {/* Slider Arrow Controls (when > 4 products) */}
            {hasSlideNavigation && (
              <div className="hidden sm:flex items-center gap-2 self-end pb-1">
                <button
                  type="button"
                  onClick={() => scrollSlider('left')}
                  aria-label="Nach links scrollen"
                  className="w-10 h-10 rounded-full bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 hover:text-[#F28611] flex items-center justify-center transition shadow-sm cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scrollSlider('right')}
                  aria-label="Nach rechts scrollen"
                  className="w-10 h-10 rounded-full bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 hover:text-[#F28611] flex items-center justify-center transition shadow-sm cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* 2. Category Tabs (Pill Buttons matching Mockup) */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pt-6 pb-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (sliderRef.current) {
                      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                    isActive
                      ? 'bg-[#F28611] text-white shadow-md shadow-orange-500/25 ring-2 ring-[#F28611]/30'
                      : 'bg-white hover:bg-stone-100 text-stone-800 border border-stone-200/90 shadow-xs'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Products Container (Grid for Alle Fahrräder / Carousel Slider for Category when > 4) */}
        {activeTab === 'all' ? (
          /* "Alle Fahrräder": 8 products grid in 2 rows of 4 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {displayedProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                prod={prod}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                isWishlisted={wishlistStore.hasItem(prod.id)}
              />
            ))}
          </div>
        ) : (
          /* Specific Category Slider: min 4 items, horizontal slide with snap */
          <div className="relative group/slider">
            <div
              ref={sliderRef}
              className="flex gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 px-0.5"
            >
              {displayedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="w-[calc(100%-16px)] sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] shrink-0 snap-start"
                >
                  <ProductCard
                    prod={prod}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlistStore.hasItem(prod.id)}
                  />
                </div>
              ))}
            </div>

            {/* Mobile / Tablet floating arrow indicators */}
            {hasSlideNavigation && (
              <div className="flex sm:hidden items-center justify-between mt-3 px-2">
                <span className="text-xs font-semibold text-stone-500">
                  {displayedProducts.length} Modelle verfügbar (wischen)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollSlider('left')}
                    aria-label="Zurück"
                    className="w-8 h-8 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-700 shadow-xs"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollSlider('right')}
                    aria-label="Weiter"
                    className="w-8 h-8 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-700 shadow-xs"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Bottom View All / Voir Plus Button (Dynamic per category) */}
        <div className="text-center mt-12 sm:mt-14">
          <Link
            href={currentTabDef.viewAllHref}
            className="inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-white hover:bg-stone-100 border-2 border-stone-300 hover:border-[#F28611] text-stone-900 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 group"
          >
            <span>{currentTabDef.viewAllLabel}</span>
            <span className="text-[#F28611] group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Dedicated Product Card matching screenshot media_1795862608033_ec74ba4c.png
function ProductCard({
  prod,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}: {
  prod: ProductItem;
  onAddToCart: (e: React.MouseEvent, prod: ProductItem) => void;
  onToggleWishlist: (e: React.MouseEvent, prod: ProductItem) => void;
  isWishlisted: boolean;
}) {
  const hasPromo = prod.compareAtPrice && prod.compareAtPrice > prod.price;

  // Harmonized badge label
  const badgeLabel =
    prod.discountLabel ||
    (prod.categorySlug === 'ebike'
      ? 'TOP E-BIKE'
      : prod.categorySlug === 'cargo'
      ? 'CARGO DEAL'
      : prod.categorySlug === 'gravel'
      ? 'GRAVEL & CROSS'
      : prod.categorySlug === 'trekking'
      ? 'KOMFORT TOUR'
      : prod.categorySlug === 'mtb'
      ? 'MTB DEAL'
      : 'ANGEBOT');

  return (
    <div className="group relative bg-white rounded-3xl border border-stone-200/90 hover:border-[#F28611] p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full select-none">
      <div>
        {/* Top Header: Red Pill Badge & Wishlist Heart Icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 rounded-full bg-[#DC2626] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
            {badgeLabel}
          </span>

          <button
            type="button"
            onClick={(e) => onToggleWishlist(e, prod)}
            aria-label="Wunschliste"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
              isWishlisted
                ? 'bg-red-50 text-red-600'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-red-500'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={isWishlisted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* Product Image Frame */}
        <Link
          href={`/produto/${prod.slug}`}
          className="relative aspect-4/3 w-full rounded-2xl bg-stone-50/70 overflow-hidden flex items-center justify-center p-3 mb-4 group-hover:bg-orange-50/30 transition-colors cursor-pointer"
        >
          {prod.images && prod.images[0] ? (
            <Image
              src={prod.images[0]}
              alt={prod.title}
              fill
              className="object-contain p-2 group-hover:scale-108 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <span className="text-4xl">🚲</span>
          )}
        </Link>

        {/* Category Label */}
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
          {prod.categoryName || 'FAHRRAD FRANKE'}
        </span>

        {/* Title */}
        <Link
          href={`/produto/${prod.slug}`}
          className="font-bold text-stone-900 group-hover:text-[#F28611] transition-colors text-sm sm:text-[15px] line-clamp-2 leading-snug cursor-pointer block"
        >
          {prod.title}
        </Link>
      </div>

      {/* Pricing & "Kaufen" Button */}
      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <Price
              amount={prod.price}
              showTax={false}
              className="text-base sm:text-lg font-black text-stone-950"
            />
          </div>
          {hasPromo && (
            <Price
              amount={prod.compareAtPrice!}
              showTax={false}
              className="text-xs text-stone-400 line-through block"
            />
          )}
        </div>

        {/* Solid Orange "Kaufen" Button matching Screenshot */}
        <button
          type="button"
          onClick={(e) => onAddToCart(e, prod)}
          aria-label="In den Warenkorb"
          className="px-4 py-2.5 rounded-xl bg-[#F28611] hover:bg-[#D97706] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span>Kaufen</span>
        </button>
      </div>
    </div>
  );
}
