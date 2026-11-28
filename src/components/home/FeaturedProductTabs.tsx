'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import QuickViewModal from '@/components/product/QuickViewModal';
import Price from '@/components/Price';

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

// Resilient fallback products with verified bicycle images
const fallbackBicycleProducts: ProductItem[] = [
  {
    id: 'bike-1',
    title: 'KTM Macina City 610 Belt - 625 Wh - 28 Zoll - Diamant',
    slug: 'ktm-macina-city-610-belt-625-wh-28-zoll-diamant',
    price: 2099.99,
    compareAtPrice: 2499.00,
    images: ['https://res.cloudinary.com/ih3hdf0k/image/upload/v1794813594/lenha/woocommerce-import/mbdo02qlcq8uc12unml9.jpg'],
    discountLabel: 'Top E-Bike',
    categorySlug: 'e-bike',
    categoryName: 'E-Bikes & Pedelecs',
    allCategories: 'e-bike city bosch 625wh',
  },
  {
    id: 'bike-2',
    title: 'Cube Cargo Sport Hybrid 500 - 500 Wh - 27,5 Zoll - Long John',
    slug: 'cube-cargo-sport-hybrid-500-500-wh-275-zoll-long-john',
    price: 3899.00,
    compareAtPrice: 4299.00,
    images: ['https://res.cloudinary.com/ih3hdf0k/image/upload/v1794812720/lenha/woocommerce-import/flpbuaalghmbfshdjkqr.jpg'],
    discountLabel: 'Cargo Deal',
    categorySlug: 'cargo',
    categoryName: 'Fahrradanhänger & Cargo',
    allCategories: 'cargo transport e-bike lastenrad',
  },
  {
    id: 'bike-3',
    title: 'KTM Macina Cross P510 - 500 Wh - 28 Zoll - Trapez',
    slug: 'ktm-macina-cross-p510-500-wh-28-zoll-trapez',
    price: 2449.00,
    compareAtPrice: 2799.00,
    images: ['https://res.cloudinary.com/ih3hdf0k/image/upload/v1794813533/lenha/woocommerce-import/usf8pcmofkklyigftxww.jpg'],
    discountLabel: 'Gravel & Cross',
    categorySlug: 'gravel',
    categoryName: 'Gravel- & Rennräder',
    allCategories: 'gravel cross bosch',
  },
  {
    id: 'bike-4',
    title: 'KTM Macina Tour CX 510 - 500 Wh - 28 Zoll - Tiefeinsteiger',
    slug: 'ktm-macina-tour-cx-510-500-wh-28-zoll-tiefeinsteiger',
    price: 2699.00,
    compareAtPrice: 2999.00,
    images: ['https://res.cloudinary.com/ih3hdf0k/image/upload/v1794813564/lenha/woocommerce-import/wh264zigeibfiyagsbel.jpg'],
    discountLabel: 'Komfort Tour',
    categorySlug: 'trekking',
    categoryName: 'Trekking- & Cityräder',
    allCategories: 'trekking tour city tiefeinsteiger',
  },
  {
    id: 'bike-5',
    title: 'Cube Aim ONE 29" - Mole n Prism - Hardtail MTB',
    slug: 'cube-aim-one-29-mole-n-prism',
    price: 649.00,
    compareAtPrice: 749.00,
    images: ['https://res.cloudinary.com/ih3hdf0k/image/upload/v1794813594/lenha/woocommerce-import/mbdo02qlcq8uc12unml9.jpg'],
    discountLabel: 'MTB Bestseller',
    categorySlug: 'mountainbike',
    categoryName: 'Mountainbikes (MTB)',
    allCategories: 'mountainbike mtb hardtail 29zoll',
  },
  {
    id: 'bike-6',
    title: 'Fahrradanhänger Croozer Cargo Kalle - Transportanhänger',
    slug: 'fahrradanhaenger-croozer-cargo-kalle',
    price: 318.99,
    compareAtPrice: 389.00,
    images: ['https://res.cloudinary.com/ih3hdf0k/image/upload/v1794812720/lenha/woocommerce-import/flpbuaalghmbfshdjkqr.jpg'],
    discountLabel: 'Top Anhänger',
    categorySlug: 'anhaenger',
    categoryName: 'Fahrradanhänger & Cargo',
    allCategories: 'anhaenger cargo croozer transport',
  },
];

function classifyProductForTab(
  p: ProductItem
): 'ebike' | 'mtb' | 'gravel' | 'trekking' | 'cargo' | 'other' {
  const t = ((p.title || '') + ' ' + (p.categorySlug || '') + ' ' + (p.allCategories || '')).toLowerCase();

  // Cargo & Anhänger
  if (t.includes('croozer') || t.includes('cargo') || t.includes('anhänger') || t.includes('kalle') || t.includes('long john') || t.includes('dreirad')) {
    return 'cargo';
  }

  // Mountainbikes
  if (t.includes('aim') || t.includes('mountainbike') || t.includes('mtb') || t.includes('hardtail') || t.includes('fully') || t.includes('reaction')) {
    return 'mtb';
  }

  // Gravel & Rennräder
  if (t.includes('gravel') || t.includes('rennrad') || t.includes('cross') || t.includes('road')) {
    return 'gravel';
  }

  // Trekking & City
  if (t.includes('trekking') || t.includes('tour') || t.includes('tiefeinsteiger') || t.includes('trapez') || t.includes('diamant')) {
    return 'trekking';
  }

  // E-Bikes
  if (t.includes('e-bike') || t.includes('macina') || t.includes('wh') || t.includes('bosch') || t.includes('hybrid') || t.includes('pedelec')) {
    return 'ebike';
  }

  return 'other';
}

export default function FeaturedProductTabs({ initialProducts }: FeaturedProductTabsProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const tabs = [
    { id: 'all', label: 'Alle Fahrräder' },
    { id: 'ebike', label: '⚡ E-Bikes' },
    { id: 'mtb', label: '🚵 Mountainbikes' },
    { id: 'gravel', label: '🚴 Gravel & Road' },
    { id: 'trekking', label: '🏙️ Trekking & City' },
    { id: 'cargo', label: '🛒 Anhänger & Cargo' },
  ];

  const products: ProductItem[] = React.useMemo(() => {
    const list = initialProducts && initialProducts.length > 0 ? initialProducts : fallbackBicycleProducts;
    return list;
  }, [initialProducts]);

  const filteredProducts = React.useMemo(() => {
    if (activeTab === 'all') return products;
    const tabFiltered = products.filter((p) => classifyProductForTab(p) === activeTab);
    return tabFiltered.length > 0 ? tabFiltered : products.slice(0, 4);
  }, [products, activeTab]);

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
    setToastMessage(`"${prod.title.slice(0, 28)}..." zum Warenkorb hinzugefügt`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleWishlist = (e: React.MouseEvent, prod: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    wishlistStore.toggleItem(prod.id);
  };

  return (
    <section className="py-14 sm:py-20 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <span className="text-[#F28611] font-bold text-xs uppercase tracking-widest block mb-1">
              Top-Angebote &amp; Bestseller
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight">
              Ausgewählte Fahrräder &amp; E-Bikes
            </h2>
          </div>

          {/* Interactive Category Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                    isActive
                      ? 'bg-[#F28611] text-white shadow-md shadow-orange-500/20'
                      : 'bg-white hover:bg-stone-200/70 text-stone-700 border border-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredProducts.map((prod) => {
            const hasPromo = prod.compareAtPrice && prod.compareAtPrice > prod.price;
            const isWishlisted = wishlistStore.hasItem(prod.id);

            return (
              <div
                key={prod.id}
                className="group relative bg-white rounded-2xl border border-stone-200 hover:border-[#F28611] p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Top Badges & Wishlist */}
                <div className="flex items-center justify-between mb-2 z-10">
                  {prod.discountLabel ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                      {prod.discountLabel}
                    </span>
                  ) : hasPromo ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F28611] text-white text-[10px] font-black uppercase tracking-wider">
                      Angebot
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold">
                      2026 Modell
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleToggleWishlist(e, prod)}
                    aria-label="Wunschliste"
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                      isWishlisted
                        ? 'bg-red-50 text-red-600'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-red-500'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                {/* Bike Image */}
                <Link
                  href={`/produto/${prod.slug}`}
                  className="relative aspect-4/3 w-full rounded-xl bg-stone-50 overflow-hidden flex items-center justify-center p-3 mb-3 group-hover:bg-orange-50/20 transition-colors"
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

                {/* Title & Specs */}
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    {prod.categoryName || 'Fahrrad Franke'}
                  </span>
                  <Link
                    href={`/produto/${prod.slug}`}
                    className="font-bold text-stone-900 group-hover:text-[#F28611] transition-colors text-sm line-clamp-2 leading-snug"
                  >
                    {prod.title}
                  </Link>
                </div>

                {/* Pricing & Add to Cart */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <Price amount={prod.price} showTax={false} className="text-base sm:text-lg font-black text-stone-950" />
                    </div>
                    {hasPromo && (
                      <Price amount={prod.compareAtPrice!} showTax={false} className="text-xs text-stone-400 line-through block" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, prod)}
                    aria-label="In den Warenkorb"
                    className="px-3.5 py-2 rounded-xl bg-[#F28611] hover:bg-[#D97706] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Kaufen</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-10">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-stone-100 border border-stone-300 text-stone-900 font-bold text-xs uppercase tracking-wider shadow-sm transition hover:scale-105"
          >
            <span>Gesamten Fahrradkatalog durchstöbern</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B131E] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <span className="text-[#F28611]">✓</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Quick View Modal */}
      {isQuickViewOpen && quickViewProduct && (
        <QuickViewModal
          isOpen={isQuickViewOpen}
          product={quickViewProduct}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </section>
  );
}
