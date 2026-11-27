'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCurrency } from '@/components/CurrencyProvider';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import SizeGuideModal from './SizeGuideModal';

interface ProductActionsProps {
  product: {
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    type: string;
    stock: number | null;
    images: string[];
    attributes?: { name: string; options: string[] }[];
    variations?: { id: string; price: string; stock?: string; image?: string; attributes: Record<string, string> }[];
    brand?: { id?: string; name: string; logo?: string | null } | null;
    forceSales?: any[];
    saleTogether?: any[];
    gtin?: string | null;
    categories?: { id: string; name: string; slug?: string }[];
    tags?: { id?: string; name: string; slug?: string }[];
  };
  enableBuyNow?: boolean;
  onVariationChange?: (image: string | null) => void;
  shippingInfo?: string[];
  contactSlug?: string;
}

const DEFAULT_FRAME_SIZES = [
  { value: 'S', label: 'S (15" / 160 – 170 cm)' },
  { value: 'M', label: 'M (17" / 170 – 180 cm)' },
  { value: 'L', label: 'L (19" / 180 – 190 cm)' },
  { value: 'XL', label: 'XL (21" / 190 – 200 cm)' },
  { value: 'XXL', label: 'XXL (23" / > 200 cm)' }
];

export default function ProductActions({ 
  product, 
  enableBuyNow = false, 
  onVariationChange, 
  shippingInfo, 
  contactSlug = 'contact' 
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedFallbackSize, setSelectedFallbackSize] = useState<string>('L');
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const { formatPrice } = useCurrency();
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [wishlistedItemName, setWishlistedItemName] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedSaleTogether, setSelectedSaleTogether] = useState<string[]>([]);
  const actionButtonsRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const t = useTranslations('Product');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!actionButtonsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(actionButtonsRef.current);
    return () => observer.disconnect();
  }, []);
  
  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const isWishlisted = wishlistStore.hasItem(product.id);

  // Variable product resolution
  const isVariable = product.type === 'VARIABLE';
  const attributes = product.attributes || [];
  const variations = product.variations || [];

  // Initialize primary size attribute if available
  useEffect(() => {
    if (isVariable && attributes.length > 0 && Object.keys(selectedAttributes).length === 0) {
      const initial: Record<string, string> = {};
      attributes.forEach(attr => {
        if (attr.options && attr.options.length > 0) {
          initial[attr.name] = attr.options[0];
        }
      });
      setSelectedAttributes(initial);
    }
  }, [isVariable, attributes, selectedAttributes]);

  let currentVariation: { id: string; price: string; stock?: string; image?: string; attributes: Record<string, string> } | null = null;
  if (isVariable && Object.keys(selectedAttributes).length === attributes.length) {
    currentVariation = variations.find(v => {
      return Object.entries(selectedAttributes).every(([key, value]) => v.attributes[key] === value);
    }) || null;
  }

  // Notify parent of active variation image
  useEffect(() => {
    if (onVariationChange) {
      onVariationChange(currentVariation?.image || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVariation?.id]);

  const currentPrice = currentVariation ? parseFloat(currentVariation.price) : product.price;

  const getCartItemBase = (prod: any, price: number, qty: number = 1, currentVar: any = null, attrs: any = undefined) => ({
    id: currentVar ? `${prod.id}-${currentVar.id}` : (attrs?.['Rahmengröße'] ? `${prod.id}-${attrs['Rahmengröße']}` : prod.id),
    productId: prod.id,
    variationId: currentVar?.id,
    title: prod.title,
    price: price,
    image: currentVar?.image || prod.images?.[0] || '',
    quantity: qty,
    attributes: attrs,
  });

  const getLinkedItemsForCart = (qty: number) => {
    const fsItems = (product.forceSales || []).map(fs => getCartItemBase(fs, fs.price, qty));
    const stItems = (product.saleTogether || [])
      .filter(st => selectedSaleTogether.includes(st.id))
      .map(st => getCartItemBase(st, st.price, 1));
    return [...fsItems, ...stItems];
  };

  const activeCartAttributes = isVariable 
    ? (currentVariation ? selectedAttributes : undefined) 
    : { 'Rahmengröße': selectedFallbackSize };

  const handleAddToCart = () => {
    if (isVariable && !currentVariation) {
      alert(t('select_options_cart') || 'Bitte wählen Sie eine Rahmengröße aus.');
      return;
    }

    const mainItem = getCartItemBase(product, currentPrice, quantity, currentVariation, activeCartAttributes);
    const linkedItems = getLinkedItemsForCart(quantity);
    
    cartStore.addItem(mainItem, linkedItems);
    cartStore.setIsOpen(true);
    
    setAddedItemName(product.title);
    setTimeout(() => {
      setAddedItemName(null);
    }, 5000);
  };

  const handleBuyNow = () => {
    if (isVariable && !currentVariation) {
      alert(t('select_options_buy') || 'Bitte wählen Sie eine Option vor dem Kauf aus.');
      return;
    }

    const mainItem = getCartItemBase(product, currentPrice, quantity, currentVariation, activeCartAttributes);
    const linkedItems = getLinkedItemsForCart(quantity);
    
    cartStore.addItem(mainItem, linkedItems);
    router.push('/checkout');
  };

  const notificationPortal = isClient ? document.getElementById('cart-notification-portal') : null;

  const handleToggleWishlist = () => {
    const wasWishlisted = wishlistStore.hasItem(product.id);
    wishlistStore.toggleItem(product.id);
    
    if (!wasWishlisted) {
      setWishlistedItemName(product.title);
      wishlistStore.setIsOpen(true);
      setTimeout(() => {
        setWishlistedItemName(null);
      }, 5000);
    }
  };

  // Determine size options for dropdown
  const sizeAttribute = attributes.find(a => /größe|size|rahmen/i.test(a.name)) || attributes[0];
  const sizeOptions = sizeAttribute 
    ? sizeAttribute.options.map(opt => ({ value: opt, label: opt }))
    : DEFAULT_FRAME_SIZES;

  const currentSelectedSize = sizeAttribute 
    ? (selectedAttributes[sizeAttribute.name] || sizeOptions[0]?.value) 
    : selectedFallbackSize;

  const handleSizeChange = (val: string) => {
    if (sizeAttribute) {
      setSelectedAttributes(prev => ({ ...prev, [sizeAttribute.name]: val }));
    } else {
      setSelectedFallbackSize(val);
    }
  };

  const monthlyRate = (currentPrice / 12).toFixed(2);

  return (
    <div className="w-full flex flex-col">
      {/* Toast notifications */}
      {addedItemName && notificationPortal && createPortal(
        <div className="bg-[#16A34A] text-white px-6 py-4 mb-6 flex flex-col sm:flex-row items-center justify-between shadow-md rounded-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-sm font-medium">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            <span>{addedItemName} wurde erfolgreich in den Warenkorb gelegt!</span>
          </div>
          <Link href="/cart" className="mt-3 sm:mt-0 text-xs font-bold tracking-wider hover:underline whitespace-nowrap bg-black/20 hover:bg-black/30 transition-colors px-5 py-2.5 rounded-lg">
            WARENKORB ANZEIGEN
          </Link>
        </div>,
        notificationPortal
      )}

      {wishlistedItemName && notificationPortal && createPortal(
        <div className="bg-[#F28611] text-white px-6 py-4 mb-6 flex flex-col sm:flex-row items-center justify-between shadow-md rounded-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-sm font-medium">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <span>„{wishlistedItemName}“ wurde zu Ihrem Wunschzettel hinzugefügt!</span>
          </div>
          <Link href="/wishlist" className="mt-3 sm:mt-0 text-xs font-bold tracking-wider hover:underline whitespace-nowrap bg-black/20 hover:bg-black/30 transition-colors px-5 py-2.5 rounded-lg">
            WUNSCHZETTEL ANZEIGEN
          </Link>
        </div>,
        notificationPortal
      )}

      {/* =========================================================================
          BUY BOX CARD — MATCHING REFERENCE SCREENSHOT
          ========================================================================= */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col">
        
        {/* Brand Header */}
        <div className="flex justify-center items-center mb-3">
          {product.brand?.logo ? (
            <Image 
              width={140} 
              height={45} 
              src={product.brand.logo} 
              alt={product.brand.name} 
              className="h-10 object-contain" 
            />
          ) : (
            <span className="text-2xl font-black tracking-widest text-[#0B131E] uppercase">
              {product.brand?.name || 'CUBE'}
            </span>
          )}
        </div>

        {/* Price & Tiefpreisgarantie */}
        <div className="flex flex-col items-center justify-center mb-5">
          {product.compareAtPrice && product.compareAtPrice > currentPrice && (
            <span className="text-sm sm:text-base text-gray-400 line-through mb-0.5">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {formatPrice(currentPrice)}
          </div>
          <div className="mt-1.5">
            <span className="inline-flex items-center gap-1 bg-[#DC2626] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-2xs">
              Tiefpreisgarantie ★
            </span>
          </div>
        </div>

        {/* Additional attributes selection if product has multiple (e.g. Farbe) */}
        {isVariable && attributes.length > 1 && (
          <div className="space-y-3 mb-4 pt-2 border-t border-gray-100">
            {attributes.filter(a => a !== sizeAttribute).map(attr => (
              <div key={attr.name}>
                <span className="text-xs text-gray-500 mb-1.5 block font-medium">
                  {attr.name}: <strong className="text-gray-900">{selectedAttributes[attr.name]}</strong>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {attr.options.map((opt: string) => {
                    const isSelected = selectedAttributes[attr.name] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: opt }))}
                        className={`px-3 py-1 text-xs rounded-lg border font-semibold transition cursor-pointer ${
                          isSelected 
                            ? 'border-[#F28611] bg-orange-50 text-[#F28611] ring-1 ring-[#F28611]' 
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Size Guide Trigger Link */}
        <div className="w-full flex justify-end mb-1.5">
          <button
            type="button"
            onClick={() => setIsSizeModalOpen(true)}
            className="text-xs text-gray-500 hover:text-[#F28611] transition underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>📐</span> Größentabelle ansehen
          </button>
        </div>

        {/* ACTION ROW: [ ? ] [ Size Dropdown v ] [ 🛒 In den Warenkorb ] */}
        <div ref={actionButtonsRef} className="w-full flex items-center gap-2 mb-3">
          {/* Circular Help Button */}
          <button
            type="button"
            onClick={() => setIsSizeModalOpen(true)}
            title="Größenberatung öffnen"
            aria-label="Größenberatung öffnen"
            className="w-11 h-11 rounded-full bg-gray-500 hover:bg-gray-700 text-white font-bold flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-colors text-base"
          >
            ?
          </button>

          {/* Styled Size Selector Dropdown */}
          <div className="relative flex-1">
            <select
              value={currentSelectedSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="w-full h-11 appearance-none bg-white border border-gray-300 rounded-xl px-4 pr-8 text-sm font-bold text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F28611] focus:border-transparent transition cursor-pointer shadow-2xs"
            >
              {sizeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* High-Conversion Green CTA Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isVariable && !currentVariation}
            className={`h-11 font-black text-sm px-5 sm:px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              isVariable && !currentVariation
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>In den Warenkorb</span>
          </button>
        </div>

        {/* Instant Buy Button (optional from settings) */}
        {enableBuyNow && (
          <button 
            type="button"
            onClick={handleBuyNow}
            className="w-full mb-3 bg-[#F28611] hover:bg-orange-600 active:scale-98 text-white font-bold rounded-xl py-2.5 transition shadow-xs text-sm cursor-pointer"
          >
            Sofort kaufen (Express Checkout)
          </button>
        )}

        {/* Financing / Ratenzahlung Teaser */}
        <div className="w-full text-center text-xs text-gray-600 mb-4 py-2 px-3 bg-gray-50/80 rounded-xl flex items-center justify-center gap-1.5 font-medium border border-gray-100">
          <span>Ratenzahlung ab <strong className="text-gray-900 font-bold">{monthlyRate} € / Monat</strong> mit</span>
          <span className="font-extrabold text-[#003087]">PayPal</span>
          <span className="text-gray-300">/</span>
          <span className="font-extrabold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded text-[11px] border border-pink-200">Klarna</span>
        </div>

        {/* Delivery & Stock Matrix (2 Columns matching reference image) */}
        <div className="w-full grid grid-cols-2 gap-3 py-4 border-y border-gray-100 mb-4">
          {/* Online Warehouse Stock */}
          <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online auf Lager</span>
            </div>
            <span className="text-[11px] text-gray-500 leading-tight">
              Lieferzeit: 3-5 Werktage (Montiert)
            </span>
          </div>

          {/* Store Availability */}
          <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Nicht in Filiale</span>
            </div>
            <span className="text-[11px] text-gray-500 leading-tight">
              Kostenloser Rückversand
            </span>
          </div>
        </div>

        {/* Reassurance Red Pill Banner */}
        <div className="w-full bg-[#DC2626] text-white font-bold py-2.5 px-4 rounded-full text-xs sm:text-sm text-center shadow-2xs flex items-center justify-center gap-2 mb-3.5 tracking-wide">
          <span>30 Tage Rückgaberecht &amp; Tiefpreisgarantie 🎁</span>
        </div>

        {/* Smooth Scroll Button to Description & Specs */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('details-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="w-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-full text-xs sm:text-sm text-center shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>Zur vollständigen Beschreibung &amp; Spezifikationen ›</span>
        </button>

        {/* Secondary Actions (Wishlist & Beratung) */}
        <div className="w-full flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs text-gray-500">
          <button
            type="button"
            onClick={handleToggleWishlist}
            className="hover:text-[#F28611] flex items-center gap-1.5 font-medium cursor-pointer transition"
          >
            <svg className="w-4 h-4" fill={isWishlisted ? '#F28611' : 'none'} stroke={isWishlisted ? '#F28611' : 'currentColor'} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{isWishlisted ? 'Auf dem Wunschzettel' : 'Auf den Wunschzettel'}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push(`/${contactSlug}`)}
            className="hover:text-[#F28611] flex items-center gap-1.5 font-medium cursor-pointer transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Frage zum Fahrrad stellen</span>
          </button>
        </div>

      </div>

      {/* Force Sales UI (if configured on product) */}
      {product.forceSales && product.forceSales.length > 0 && (
        <div className="mt-4 border-2 border-orange-500 bg-orange-50 rounded-xl p-4">
          <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {t('force_sales_title')}
          </h4>
          <div className="space-y-2">
            {product.forceSales.map(fs => (
              <div key={fs.id} className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-2xs border border-orange-100">
                {fs.images?.[0] && <Image width={48} height={48} src={fs.images[0]} alt={fs.title} className="w-10 h-10 object-contain rounded" />}
                <div className="text-xs">
                  <div className="font-medium text-gray-900 leading-tight">{fs.title}</div>
                  <div className="font-bold text-gray-700">{formatPrice(fs.price)}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-orange-700 mt-2 leading-relaxed">
            {t('force_sales_msg')}
          </p>
        </div>
      )}

      {/* Sale Together / Cross-sell UI */}
      {product.saleTogether && product.saleTogether.length > 0 && (
        <div className="mt-4 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
          <h4 className="text-xs font-bold text-gray-900 mb-3">{t('frequently_bought_together')}</h4>
          <div className="space-y-2.5">
            {product.saleTogether.map(st => (
              <label key={st.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-gray-200">
                <input 
                  type="checkbox"
                  checked={selectedSaleTogether.includes(st.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedSaleTogether(prev => [...prev, st.id]);
                    else setSelectedSaleTogether(prev => prev.filter(id => id !== st.id));
                  }}
                  className="w-4 h-4 text-[#F28611] rounded border-gray-300 focus:ring-[#F28611]"
                />
                {st.images?.[0] && <Image width={48} height={48} src={st.images[0]} alt={st.title} className="w-10 h-10 object-contain rounded bg-white border border-gray-100" />}
                <div className="flex-1 text-xs">
                  <div className="font-medium text-gray-900 leading-tight line-clamp-1">{st.title}</div>
                  <div className="font-bold text-gray-700">{formatPrice(st.price)}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Product Meta Specifications Clean Box */}
      <div className="mt-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100 text-xs text-gray-600 space-y-1.5">
        <p>
          <span className="font-bold text-gray-900">Artikelnummer / SKU: </span>
          <span className="font-mono text-gray-700">{product.id.split('-')[0].toUpperCase()}</span>
        </p>
        {product.brand && (
          <p>
            <span className="font-bold text-gray-900">Hersteller: </span>
            <span className="text-gray-700">{product.brand.name}</span>
          </p>
        )}
        {product.categories && product.categories.length > 0 && (
          <p>
            <span className="font-bold text-gray-900">Kategorie: </span>
            {product.categories.map((c: any, index: number) => (
              <span key={c.id}>
                <Link href={`/product-category/${c.slug || c.id}`} className="hover:text-[#F28611] hover:underline transition-colors text-gray-700">
                  {c.name}
                </Link>
                {index < product.categories!.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        )}
        {product.gtin && (
          <p>
            <span className="font-bold text-gray-900">EAN / GTIN: </span>
            <span className="font-mono text-gray-700">{product.gtin}</span>
          </p>
        )}
      </div>

      {/* Frame Size Guide Interactive Modal */}
      <SizeGuideModal 
        isOpen={isSizeModalOpen} 
        onClose={() => setIsSizeModalOpen(false)} 
      />

      {/* Mobile Sticky Bottom Add-to-Cart Bar */}
      {showStickyBar && (
        <aside 
          aria-label="Schnellkauf"
          className="lg:hidden fixed bottom-[52px] left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 z-50 p-2.5 px-4 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200 pb-safe"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {product.images?.[0] && (
              <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200 relative">
                <Image
                  src={currentVariation?.image || product.images[0]}
                  alt={product.title}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-stone-900 truncate leading-tight">{product.title}</p>
              <p className="text-xs font-black text-[#F28611]">{formatPrice(currentPrice)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isVariable && !currentVariation}
            className={`font-extrabold text-xs py-2.5 px-4 rounded-xl shrink-0 shadow-md transition-all cursor-pointer ${
              isVariable && !currentVariation
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white'
            }`}
          >
            In den Warenkorb
          </button>
        </aside>
      )}
    </div>
  );
}
