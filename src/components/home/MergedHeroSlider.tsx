'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface HeroSlide {
  id: string;
  image: string;
  eyebrow: string;
  titleWhite: string;
  titleGold: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  tags: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image: '/images/slides/slide-1.png',
    eyebrow: 'FAHRRAD FRANKE · PREMIUM E-BIKES & BIKES 2026',
    titleWhite: 'RIDE BEYOND.',
    titleGold: 'LIVE FREEDOM.',
    description: 'Entdecken Sie unsere Premium E-Bikes, Mountainbikes und Gravel Bikes. Höchste Performance, Bosch Smart System und kompromisslose Fahrfreude.',
    primaryCtaText: 'Fahrräder entdecken',
    primaryCtaLink: '/shop',
    secondaryCtaText: 'Top E-Bike Bestseller',
    secondaryCtaLink: '/shop?category=e-bike',
    tags: 'BOSCH SMART SYSTEM · SHIMANO · 2 JAHRE GARANTIE',
  },
  {
    id: 'slide-2',
    image: '/images/slides/slide-2.jpg',
    eyebrow: 'BOSCH PERFORMANCE CX · MAXIMALE REICHWEITE',
    titleWhite: 'VOLLE POWER.',
    titleGold: 'JEDER TRAIL.',
    description: 'Bis zu 85 Nm Drehmoment und 750 Wh Akkukapazität für steilste Anstiege und ausgedehnte Touren ohne Reichweitenangst.',
    primaryCtaText: 'E-Bikes ansehen',
    primaryCtaLink: '/shop?category=e-bike',
    secondaryCtaText: 'Kaufberatung & Kontakt',
    secondaryCtaLink: '/contact',
    tags: '85 NM DREHMOMENT · 750 WH AKKU · FAHRBEREIT GELIEFERT',
  },
  {
    id: 'slide-3',
    image: '/images/slides/slide-3.jpg',
    eyebrow: 'GRAVEL & MOUNTAINBIKE · HYDRAULISCHE SCHEIBENBREMSEN',
    titleWhite: 'PURE GESCHWINDIGKEIT.',
    titleGold: 'MAXIMALE KONTROLLE.',
    description: 'Leichte Rahmen, präzise Schaltungen und robuste 29-Zoll-Bereifung für Straße, Schotter und anspruchsvolle Singletrails.',
    primaryCtaText: 'Gravel & MTB entdecken',
    primaryCtaLink: '/shop?category=mountainbike',
    secondaryCtaText: 'Zubehör & Helme',
    secondaryCtaLink: '/shop?category=zubehoer',
    tags: 'SHIMANO DEORE · 29 ZOLL LAUFRÄDER · TIEFPREISGARANTIE',
  },
];

interface MergedHeroSliderProps {
  config?: any;
  showcaseProducts?: any[];
  isPreview?: boolean;
  sectionId?: string;
}

export default function MergedHeroSlider({ config }: MergedHeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides: HeroSlide[] = React.useMemo(() => [
    {
      id: 'slide-1',
      image: config?.slide1_image || DEFAULT_SLIDES[0].image,
      eyebrow: config?.slide1_eyebrow || DEFAULT_SLIDES[0].eyebrow,
      titleWhite: config?.slide1_titleWhite || DEFAULT_SLIDES[0].titleWhite,
      titleGold: config?.slide1_titleGold || DEFAULT_SLIDES[0].titleGold,
      description: config?.slide1_description || DEFAULT_SLIDES[0].description,
      primaryCtaText: config?.slide1_cta1Text || DEFAULT_SLIDES[0].primaryCtaText,
      primaryCtaLink: config?.slide1_cta1Link || DEFAULT_SLIDES[0].primaryCtaLink,
      secondaryCtaText: config?.slide1_cta2Text || DEFAULT_SLIDES[0].secondaryCtaText,
      secondaryCtaLink: config?.slide1_cta2Link || DEFAULT_SLIDES[0].secondaryCtaLink,
      tags: config?.slide1_tags || DEFAULT_SLIDES[0].tags,
    },
    {
      id: 'slide-2',
      image: config?.slide2_image || DEFAULT_SLIDES[1].image,
      eyebrow: config?.slide2_eyebrow || DEFAULT_SLIDES[1].eyebrow,
      titleWhite: config?.slide2_titleWhite || DEFAULT_SLIDES[1].titleWhite,
      titleGold: config?.slide2_titleGold || DEFAULT_SLIDES[1].titleGold,
      description: config?.slide2_description || DEFAULT_SLIDES[1].description,
      primaryCtaText: config?.slide2_cta1Text || DEFAULT_SLIDES[1].primaryCtaText,
      primaryCtaLink: config?.slide2_cta1Link || DEFAULT_SLIDES[1].primaryCtaLink,
      secondaryCtaText: config?.slide2_cta2Text || DEFAULT_SLIDES[1].secondaryCtaText,
      secondaryCtaLink: config?.slide2_cta2Link || DEFAULT_SLIDES[1].secondaryCtaLink,
      tags: config?.slide2_tags || DEFAULT_SLIDES[1].tags,
    },
    {
      id: 'slide-3',
      image: config?.slide3_image || DEFAULT_SLIDES[2].image,
      eyebrow: config?.slide3_eyebrow || DEFAULT_SLIDES[2].eyebrow,
      titleWhite: config?.slide3_titleWhite || DEFAULT_SLIDES[2].titleWhite,
      titleGold: config?.slide3_titleGold || DEFAULT_SLIDES[2].titleGold,
      description: config?.slide3_description || DEFAULT_SLIDES[2].description,
      primaryCtaText: config?.slide3_cta1Text || DEFAULT_SLIDES[2].primaryCtaText,
      primaryCtaLink: config?.slide3_cta1Link || DEFAULT_SLIDES[2].primaryCtaLink,
      secondaryCtaText: config?.slide3_cta2Text || DEFAULT_SLIDES[2].secondaryCtaText,
      secondaryCtaLink: config?.slide3_cta2Link || DEFAULT_SLIDES[2].secondaryCtaLink,
      tags: config?.slide3_tags || DEFAULT_SLIDES[2].tags,
    },
  ], [config]);

  const totalSlides = slides.length;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Autoplay every 7 seconds, paused on hover
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, totalSlides, currentIndex]);

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <section
      className="relative w-full h-screen min-h-[640px] max-h-[960px] bg-stone-950 text-white overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Hero Fahrrad Franke"
    >
      {/* Background Slides with Crossfade and Subtle Zoom */}
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={slide.image}
                alt={`${slide.titleWhite} ${slide.titleGold}`}
                fill
                priority={index === 0}
                className={`object-cover object-center transition-transform duration-[10000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                sizes="100vw"
                quality={90}
              />
              {/* Overlays removed per user request for direct visual analysis */}
            </div>
          </div>
        );
      })}

      {/* Main Content Container (Fused with Header above) */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-between pt-28 sm:pt-36 lg:pt-40 pb-6 sm:pb-8">
        {/* Center / Left: Slide Typography & CTAs */}
        <div className="max-w-2xl lg:max-w-3xl my-auto">
          {/* Eyebrow / Tag */}
          <div className="inline-flex items-center gap-2 mb-2.5 sm:mb-3.5">
            <span className="text-[#F59E0B] font-bold tracking-[0.22em] text-xs sm:text-sm uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
              {activeSlide.eyebrow}
            </span>
          </div>

          {/* Giant Impact Headline */}
          <h1 className="font-black italic tracking-tight uppercase leading-[0.95] text-4xl sm:text-6xl md:text-7xl lg:text-[76px] drop-shadow-[0_4px_22px_rgba(0,0,0,0.95)]">
            <span className="block text-white transition-all duration-700 transform">
              {activeSlide.titleWhite}
            </span>
            <span className="block text-[#F59E0B] transition-all duration-700 transform">
              {activeSlide.titleGold}
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="mt-3.5 sm:mt-5 text-stone-100 text-xs sm:text-base md:text-lg max-w-xl font-normal leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            {activeSlide.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-5 sm:mt-7">
            {/* Primary Solid Gold Pill Button */}
            {activeSlide.primaryCtaText && (
              <Link
                href={activeSlide.primaryCtaLink}
                className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#F59E0B] hover:bg-[#d97706] text-stone-950 font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 group"
              >
                <span>{activeSlide.primaryCtaText}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            )}

            {/* Secondary High-Value Button */}
            {activeSlide.secondaryCtaText && (
              <Link
                href={activeSlide.secondaryCtaLink}
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/60 hover:border-white font-bold text-xs sm:text-sm tracking-wider uppercase backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-black/40"
              >
                <span>{activeSlide.secondaryCtaText}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Bar: Left Tags & Right Slider Pagination (Guaranteed Always Visible across all slides) */}
        <div className="shrink-0 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/20">
          {/* Bottom Left: Tagline in High-Contrast Frosted Badge */}
          <div className="inline-flex items-center">
            <span className="px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-white font-bold tracking-[0.22em] text-[10px] sm:text-xs uppercase shadow-xl drop-shadow-md">
              {activeSlide.tags}
            </span>
          </div>

          {/* Bottom Right: Slider Navigation (< > 01 / 03 < >) in High-Contrast Frosted Capsule */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 self-end sm:self-auto">
            {/* Slide Arrows & Counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 shadow-xl">
              {/* Prev Button */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Vorheriger Slide"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-[#F59E0B] hover:text-stone-950 border border-white/20 hover:border-[#F59E0B] text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Slide Counter (01 / 03) */}
              <div className="px-2 font-mono text-xs sm:text-sm font-bold flex items-center select-none text-white">
                <span className="text-[#F59E0B] font-black text-sm sm:text-base">
                  {String(currentIndex + 1).padStart(2, '0')}
                </span>
                <span className="text-white/40 mx-1.5 font-normal">/</span>
                <span className="text-white/80">
                  {String(totalSlides).padStart(2, '0')}
                </span>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Nächster Slide"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-[#F59E0B] hover:text-stone-950 border border-white/20 hover:border-[#F59E0B] text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Quick-Jump Dots */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Gehe zu Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 bg-[#F59E0B]'
                      : 'w-2 bg-white/40 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
