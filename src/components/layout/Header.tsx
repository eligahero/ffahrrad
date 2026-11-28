'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { getUserRole } from '@/actions/auth';
import { searchProducts } from '@/actions/public';
import Price from '@/components/Price';

const LoginModal = dynamic(() => import('@/components/auth/LoginModal'), { ssr: false });
const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false });
const WishlistDrawer = dynamic(() => import('@/components/wishlist/WishlistDrawer'), { ssr: false });
const MobileBottomNav = dynamic(() => import('@/components/layout/MobileBottomNav'), { ssr: false });
const MobileSidebar = dynamic(() => import('@/components/layout/MobileSidebar'), { ssr: false });
const MobileSearchOverlay = dynamic(() => import('@/components/layout/MobileSearchOverlay'), { ssr: false });

type HeaderProps = {
  announcement?: string;
  logoImage?: string;
  headerLogoHeight?: string;
  mobileLogoHeight?: string;
  menuLinks?: Array<{ label: string; url: string }>;
  topBarLinks?: Array<{ label: string; icon: string; url: string }>;
  loginText?: string;
  myAccountText?: string;
  adminDashboardText?: string;
  topBarBgColor?: string;
  topBarTextColor?: string;
  categories?: Array<{ id: string; name: string; slug: string | null; parentId?: string | null }>;
  searchBorderColor?: string;
  searchPlaceholder?: string;
  searchBtnText?: string;
  searchBtnBgColor?: string;
  searchBtnTextColor?: string;
  showNew?: boolean;
  showHot?: boolean;
  showSale?: boolean;
  mobileAboutTitle?: string;
  mobileAboutDesc?: string;
  mobileMenuLinks?: Array<{ label: string; url: string }>;
  mobileContactAddress?: string;
  mobileContactPhone?: string;
  mobileContactEmail?: string;
  mobileContactWebsite?: string;
  mobileHeaderBorderColor?: string;
  allCategoriesBgColor?: string;
  allCategoriesTextColor?: string;
  userRole?: 'ADMIN' | 'CUSTOMER' | null;
};

export default function Header({
  announcement = 'Kostenloser Speditionsversand ab 150 € • 30 Tage Rückgaberecht',
  logoImage = '',
  menuLinks = [],
  topBarLinks = [
    { label: 'Sendung verfolgen', icon: 'truck', url: '/order-tracking' }
  ],
  categories = [],
  searchPlaceholder = 'Fahrräder, E-Bikes oder Zubehör suchen...',
  mobileAboutTitle = 'Fahrrad Franke',
  mobileAboutDesc = 'Ihr Fachhändler für E-Bikes, Mountainbikes, Gravel- und Cityräder mit persönlicher Beratung.',
  mobileMenuLinks = [],
  mobileContactAddress = '',
  mobileContactPhone = '',
  mobileContactEmail = '',
  mobileContactWebsite = '',
  userRole = null,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [actualUserRole, setActualUserRole] = useState<'ADMIN' | 'CUSTOMER' | null>(userRole);

  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();

  const cartItems = cartStore.getTotalItems();
  const cartTotal = cartStore.getTotalPrice();
  const wishlistItems = wishlistStore.items.length;

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Desktop search popover state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    getUserRole().then((role) => {
      setActualUserRole(role as 'ADMIN' | 'CUSTOMER' | null);
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const results = await searchProducts(searchQuery, 'all', 6);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Header position & style classes:
  // On Homepage:
  // - at top: absolute top-0, transparent, merged directly into Hero banner
  // - on scroll: fixed top-0, blurred dark glassmorphic background
  // On Internal pages:
  // - sticky top-0, sleek dark background so page titles are not covered
  const headerContainerClass = isHome
    ? isScrolled
      ? 'fixed top-0 left-0 right-0 z-50 bg-[#0B131E]/95 backdrop-blur-md shadow-2xl border-b border-white/10 transition-all duration-300 py-3 text-white'
      : 'absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/85 via-black/35 to-transparent border-b border-transparent transition-all duration-300 py-4 sm:py-5 text-white'
    : 'sticky top-0 left-0 right-0 z-50 bg-[#0B131E] border-b border-stone-800 shadow-xl transition-all duration-300 py-3 text-white';

  return (
    <>
      <header className={headerContainerClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between gap-4 md:gap-8">
            {/* 1. Left: Brand Logo (Transparent Franke Fahrrad) */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center group gap-3">
                <div className="relative h-11 sm:h-13 w-auto flex items-center">
                  <Image
                    src="/franke-logo.png"
                    alt="Franke Fahrrad"
                    width={220}
                    height={60}
                    className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* 2. Center: Navigation Links (Matching Mockup Composition) */}
            <nav className="hidden lg:flex items-center space-x-7 xl:space-x-8 text-sm font-medium">
              {/* Startseite / Accueil */}
              <Link
                href="/"
                className={`transition-colors py-2 ${
                  isHome
                    ? 'text-white font-bold border-b-2 border-[#F59E0B]'
                    : 'text-stone-200 hover:text-[#F59E0B]'
                }`}
              >
                Startseite
              </Link>

              {/* Fahrräder ⌵ (Dropdown with Categories) */}
              <div className="relative group/bikes py-2">
                <Link
                  href="/shop"
                  className="flex items-center gap-1.5 text-stone-200 hover:text-[#F59E0B] transition-colors cursor-pointer"
                >
                  <span>Fahrräder</span>
                  <svg
                    className="w-3.5 h-3.5 opacity-70 group-hover/bikes:rotate-180 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 w-64 bg-[#0B131E]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2.5 opacity-0 invisible group-hover/bikes:opacity-100 group-hover/bikes:visible transition-all duration-200 -translate-y-2 group-hover/bikes:translate-y-0 z-50">
                  <Link
                    href="/shop"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white font-bold text-xs transition"
                  >
                    <span>Alle Fahrräder</span>
                    <span className="text-[10px] text-stone-400">Katalog →</span>
                  </Link>
                  <div className="h-px bg-white/10 my-1" />
                  <Link
                    href="/shop?category=e-bike"
                    className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-[#F59E0B] text-xs transition"
                  >
                    <span>⚡ E-Bikes &amp; Pedelecs</span>
                    <span className="text-[9px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-black">
                      TOP
                    </span>
                  </Link>
                  <Link
                    href="/shop?category=mountainbike"
                    className="flex items-center px-3.5 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-[#F59E0B] text-xs transition"
                  >
                    <span>🚵 Mountainbikes (MTB)</span>
                  </Link>
                  <Link
                    href="/shop?category=gravel"
                    className="flex items-center px-3.5 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-[#F59E0B] text-xs transition"
                  >
                    <span>🚴 Gravel- &amp; Rennräder</span>
                  </Link>
                  <Link
                    href="/shop?category=trekking"
                    className="flex items-center px-3.5 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-[#F59E0B] text-xs transition"
                  >
                    <span>🏙️ Trekking- &amp; Cityräder</span>
                  </Link>
                  <Link
                    href="/shop?category=cargo"
                    className="flex items-center px-3.5 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-[#F59E0B] text-xs transition"
                  >
                    <span>📦 Lastenräder &amp; Cargo</span>
                  </Link>
                </div>
              </div>

              {/* Zubehör ⌵ (Dropdown with Accessories) */}
              <div className="relative group/acc py-2">
                <Link
                  href="/shop?category=zubehoer"
                  className="flex items-center gap-1.5 text-stone-200 hover:text-[#F59E0B] transition-colors cursor-pointer"
                >
                  <span>Zubehör</span>
                  <svg
                    className="w-3.5 h-3.5 opacity-70 group-hover/acc:rotate-180 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 w-64 bg-[#0B131E]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2.5 opacity-0 invisible group-hover/acc:opacity-100 group-hover/acc:visible transition-all duration-200 -translate-y-2 group-hover/acc:translate-y-0 z-50">
                  <Link
                    href="/shop?category=anhaenger"
                    className="flex items-center px-3.5 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-[#F59E0B] text-xs transition"
                  >
                    <span>🛒 Fahrradanhänger &amp; Transport</span>
                  </Link>
                  <Link
                    href="/shop?category=bekleidung"
                    className="flex items-center px-3.5 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-[#F59E0B] text-xs transition"
                  >
                    <span>🪖 Helme &amp; Bekleidung</span>
                  </Link>
                  <Link
                    href="/shop?category=sicherheit"
                    className="flex items-center px-3.5 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-[#F59E0B] text-xs transition"
                  >
                    <span>🔦 Beleuchtung &amp; Schlösser</span>
                  </Link>
                  <Link
                    href="/shop?category=komponenten"
                    className="flex items-center px-3.5 py-2 rounded-xl hover:bg-white/10 text-stone-200 hover:text-[#F59E0B] text-xs transition"
                  >
                    <span>⚙️ Komponenten &amp; Werkzeuge</span>
                  </Link>
                </div>
              </div>

              {/* Über uns */}
              <Link
                href="/shop"
                className="text-stone-200 hover:text-[#F59E0B] transition-colors py-2"
              >
                Über uns
              </Link>

              {/* Kontakt */}
              <Link
                href="/contact"
                className="text-stone-200 hover:text-[#F59E0B] transition-colors py-2"
              >
                Kontakt
              </Link>
            </nav>

            {/* 3. Right: Search, Wishlist, Account, Cart & Gold Pill Button */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Search Toggle Icon */}
              <div className="relative" ref={searchContainerRef}>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  aria-label="Suche öffnen"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-stone-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>

                {/* Desktop Search Overlay Box */}
                {isSearchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0B131E]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl z-50">
                    <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                      <input
                        type="text"
                        autoFocus
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-400 outline-none focus:border-[#F59E0B]"
                      />
                      <button
                        type="submit"
                        aria-label="Suchen"
                        className="absolute right-1.5 px-3 py-1.5 bg-[#F59E0B] text-stone-950 font-bold rounded-lg text-xs hover:bg-[#d97706] transition"
                      >
                        {isSearching ? '...' : 'Los'}
                      </button>
                    </form>

                    {/* Instant Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-white/10">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            href={`/produto/${product.slug}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl transition"
                          >
                            <div className="w-9 h-9 bg-stone-800 rounded-lg p-1 shrink-0 flex items-center justify-center">
                              {product.images && product.images[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.title}
                                  width={40}
                                  height={40}
                                  className="object-contain"
                                />
                              ) : (
                                <span className="text-xs">🚲</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-white truncate">{product.title}</p>
                              <Price amount={product.price} showTax={false} className="text-[#F59E0B] font-bold text-xs" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => wishlistStore.setIsOpen(true)}
                aria-label="Wunschliste"
                className="hidden sm:flex relative w-10 h-10 rounded-full items-center justify-center text-stone-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {mounted && wishlistItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#F59E0B] text-stone-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {wishlistItems}
                  </span>
                )}
              </button>

              {/* User Account Button */}
              <button
                type="button"
                onClick={() => {
                  if (actualUserRole) {
                    router.push(actualUserRole === 'ADMIN' ? '/admin' : '/account');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                aria-label="Konto"
                className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-stone-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>

              {/* Shopping Cart Icon (Minimalist White Icon with Gold Badge) */}
              <button
                type="button"
                onClick={() => cartStore.setIsOpen(true)}
                aria-label="Warenkorb"
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition cursor-pointer"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {mounted && cartItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#F59E0B] text-stone-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {cartItems}
                  </span>
                )}
              </button>

              {/* Golden Pill CTA Button: "Fahrräder entdecken →" (Exact Mockup Match) */}
              <Link
                href="/shop"
                className="hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#F59E0B] hover:bg-[#d97706] text-stone-950 font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-md shadow-amber-500/25 hover:scale-105 active:scale-95 shrink-0"
              >
                <span>Fahrräder entdecken</span>
                <span>→</span>
              </Link>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Navigation öffnen"
                className="lg:hidden p-2 text-stone-200 hover:text-white transition cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Modals & Drawers */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <CartDrawer isOpen={cartStore.isOpen} onClose={() => cartStore.setIsOpen(false)} />
      <WishlistDrawer isOpen={wishlistStore.isOpen} onClose={() => wishlistStore.setIsOpen(false)} />

      <MobileBottomNav
        onSearchClick={() => setIsMobileSearchOpen(true)}
        onLoginClick={() => setIsLoginModalOpen(true)}
        userRole={actualUserRole}
        onCartClick={() => cartStore.setIsOpen(true)}
      />

      <MobileSearchOverlay
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        placeholder={searchPlaceholder}
      />

      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        logoImage={logoImage}
        aboutTitle={mobileAboutTitle}
        aboutDesc={mobileAboutDesc}
        menuLinks={menuLinks && menuLinks.length > 0 ? menuLinks : mobileMenuLinks}
        contactAddress={mobileContactAddress}
        contactPhone={mobileContactPhone}
        contactEmail={mobileContactEmail}
        contactWebsite={mobileContactWebsite}
        categories={categories}
      />
    </>
  );
}
