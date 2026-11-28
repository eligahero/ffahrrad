'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { getUserRole } from '@/actions/auth';
import CurrencySelector from '@/components/currency/CurrencySelector';
import SearchModal from '@/components/search/SearchModal';

const LoginModal = dynamic(() => import('@/components/auth/LoginModal'), { ssr: false });
const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false });
const WishlistDrawer = dynamic(() => import('@/components/wishlist/WishlistDrawer'), { ssr: false });
const MobileBottomNav = dynamic(() => import('@/components/layout/MobileBottomNav'), { ssr: false });
const MobileSidebar = dynamic(() => import('@/components/layout/MobileSidebar'), { ssr: false });

const MAIN_NAV_ITEMS = [
  { label: 'STARTSEITE', href: '/' },
  { label: 'VERSAND', href: '/versand' },
  { label: 'IMPRESSUM', href: '/impressum' },
  { label: 'KONTAKT', href: '/contact' },
];

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
  logoImage = '',
  menuLinks = [],
  categories = [],
  mobileAboutTitle = 'Fahrrad Franke',
  mobileAboutDesc = 'Ihr Fachhändler für E-Bikes, Mountainbikes, Gravel- und Cityräder mit persönlicher Beratung.',
  mobileMenuLinks = [],
  mobileContactAddress = '',
  mobileContactPhone = '',
  mobileContactEmail = '',
  mobileContactWebsite = '',
  userRole = null,
}: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [actualUserRole, setActualUserRole] = useState<'ADMIN' | 'CUSTOMER' | null>(userRole);

  const cartStore = useCartStore();
  const wishlistStore = useWishlistStore();
  const cartItems = cartStore.getTotalItems();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Header position:
  // On Homepage: absolute top-0 over Hero (or fixed on scroll with subtle backdrop)
  // On Internal pages: sticky top-0
  const headerContainerClass = isHome
    ? isScrolled
      ? 'fixed top-0 left-0 right-0 z-50 bg-[#0B131E]/95 backdrop-blur-md shadow-2xl border-b border-white/10 transition-all duration-300 py-2.5 text-white'
      : 'absolute top-0 left-0 right-0 z-50 bg-transparent border-b border-transparent transition-all duration-300 py-4 sm:py-5 text-white'
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

            {/* 2. Right: Capsule Navigation Bar (Matching Capture media_1795856459966_d8be87b8.png) */}
            <div className="flex items-center gap-3">
              {/* Main Pill Capsule Container */}
              <div className="rounded-full bg-[#182535]/80 hover:bg-[#182535]/95 border border-white/10 backdrop-blur-xl px-4 sm:px-6 py-2 sm:py-2.5 flex items-center gap-4 sm:gap-6 shadow-xl transition-all duration-300">
                {/* Desktop Nav Links (STARTSEITE, VERSAND, IMPRESSUM, KONTAKT) with mustard zoom effect */}
                <nav className="hidden md:flex items-center space-x-5 lg:space-x-7 text-xs sm:text-sm">
                  {MAIN_NAV_ITEMS.map((item) => {
                    const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`inline-block py-1 tracking-wider uppercase transition-all duration-200 ease-out transform hover:scale-110 active:scale-95 hover:text-[#F59E0B] cursor-pointer select-none ${
                          isActive
                            ? 'text-white font-bold drop-shadow-xs'
                            : 'text-stone-300 font-semibold hover:text-[#F59E0B]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Vertical Divider on Desktop */}
                <div className="hidden md:block w-px h-5 bg-white/15" />

                {/* Action Icons inside the Capsule */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Category Grid Flyout Button (4 diamonds / squares matching capture) */}
                  <div className="relative" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      aria-label="Kategorien anzeigen"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0F1B2A] hover:bg-[#1A2E44] border border-white/15 text-white flex items-center justify-center transition shadow-sm cursor-pointer select-none"
                      title="Kategorien"
                    >
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    </button>

                    {/* Category Dropdown */}
                    {isCategoryDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-64 bg-[#0B131E]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-2.5 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-stone-400 border-b border-white/10">
                          Fahrrad Kategorien
                        </div>
                        <div className="p-1 space-y-1">
                          <Link
                            href="/shop"
                            onClick={() => setIsCategoryDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition"
                          >
                            <span>Alle Fahrräder</span>
                            <span className="text-[10px] text-stone-400">Shop →</span>
                          </Link>
                          <Link
                            href="/shop?category=e-bike"
                            onClick={() => setIsCategoryDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-stone-200 hover:text-[#F59E0B] transition"
                          >
                            <span>⚡ E-Bikes &amp; Pedelecs</span>
                            <span className="text-[9px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded font-black">
                              HOT
                            </span>
                          </Link>
                          <Link
                            href="/shop?category=mountainbike"
                            onClick={() => setIsCategoryDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-stone-200 hover:text-[#F59E0B] transition"
                          >
                            <span>🚵 Mountainbikes (MTB)</span>
                          </Link>
                          <Link
                            href="/shop?category=gravel"
                            onClick={() => setIsCategoryDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-stone-200 hover:text-[#F59E0B] transition"
                          >
                            <span>🚴 Gravel- &amp; Rennräder</span>
                          </Link>
                          <Link
                            href="/shop?category=trekking"
                            onClick={() => setIsCategoryDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-stone-200 hover:text-[#F59E0B] transition"
                          >
                            <span>🏙️ Trekking- &amp; Cityräder</span>
                          </Link>
                          <Link
                            href="/shop?category=anhaenger"
                            onClick={() => setIsCategoryDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-stone-200 hover:text-[#F59E0B] transition"
                          >
                            <span>🛒 Fahrradanhänger &amp; Cargo</span>
                          </Link>
                          <Link
                            href="/shop?category=zubehoer"
                            onClick={() => setIsCategoryDropdownOpen(false)}
                            className="flex items-center px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-stone-200 hover:text-[#F59E0B] transition"
                          >
                            <span>🔦 Zubehör &amp; Helme</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search Icon (Magnifying Glass - Triggers SearchModal) */}
                  <button
                    type="button"
                    onClick={() => setIsSearchModalOpen(true)}
                    aria-label="Recherche"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-white/10 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                    title="Recherche"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>

                  {/* Shopping Bag Icon with Handles (Matching Capture 🛍️) */}
                  <button
                    type="button"
                    onClick={() => cartStore.setIsOpen(true)}
                    aria-label="Panier"
                    className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-white/10 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                    title="Panier"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    {mounted && cartItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#F59E0B] text-stone-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                        {cartItems}
                      </span>
                    )}
                  </button>

                  {/* Multi-Currency Selector (EUR, DKK, HUF/Forint, SEK, CHF) */}
                  <div className="pl-1">
                    <CurrencySelector />
                  </div>
                </div>
              </div>

              {/* Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
                className="md:hidden w-10 h-10 rounded-full bg-[#182535]/80 border border-white/10 flex items-center justify-center text-white transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Search Modal matching capture media_1795856508092_f95bc268.jpg */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Global Modals & Drawers */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <CartDrawer isOpen={cartStore.isOpen} onClose={() => cartStore.setIsOpen(false)} />
      <WishlistDrawer isOpen={wishlistStore.isOpen} onClose={() => wishlistStore.setIsOpen(false)} />

      <MobileBottomNav
        onSearchClick={() => setIsSearchModalOpen(true)}
        onLoginClick={() => setIsLoginModalOpen(true)}
        userRole={actualUserRole}
        onCartClick={() => cartStore.setIsOpen(true)}
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
