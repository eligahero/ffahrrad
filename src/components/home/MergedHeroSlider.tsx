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

const SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image: '/images/slides/slide-1.png',
    eyebrow: 'DISCOVER YOUR NEXT RIDE · 2026',
    titleWhite: 'RIDE BEYOND.',
    titleGold: 'LIVE FREEDOM.',
    description: 'Entdecken Sie eine neue Art des Fahrens. Außergewöhnliche Fahrräder, entwickelt um Grenzen zu verschieben.',
    primaryCtaText: 'Fahrräder entdecken',
    primaryCtaLink: '/shop',
    secondaryCtaText: 'Unsere Welt',
    secondaryCtaLink: '/shop',
    tags: 'PERFORMANCE · DESIGN · FREIHEIT',
  },
  {
    id: 'slide-2',
    image: '/images/slides/slide-2.jpg',
    eyebrow: 'POWER & REVOLUTION · E-BIKES',
    titleWhite: 'EXPLORE MORE.',
    titleGold: 'CONQUER PEAKS.',
    description: 'Kraftvolle Bosch- & Shimano-Antriebe, grenzenlose Reichweite und maximale Souveränität auf jedem Trail.',
    primaryCtaText: 'E-Bikes ansehen',
    primaryCtaLink: '/shop?category=e-bike',
    secondaryCtaText: 'Kaufberatung',
    secondaryCtaLink: '/contact',
    tags: 'KRAFT · INNOVATION · REICHWEITE',
  },
  {
    id: 'slide-3',
    image: '/images/slides/slide-3.jpg',
    eyebrow: 'PRECISION ENGINEERING · GRAVEL & MTB',
    titleWhite: 'PURE SPEED.',
    titleGold: 'EVERY ROAD.',
    description: 'Vom Großstadtdschungel bis zum anspruchsvollen Singletrack – entwickelt für kompromisslose Präzision und Agilität.',
    primaryCtaText: 'Gravel & MTB entdecken',
    primaryCtaLink: '/shop?category=gravel',
    secondaryCtaText: 'Zubehör ansehen',
    secondaryCtaLink: '/shop?category=zubehoer',
    tags: 'PRÄZISION · AGILITÄT · KONTROLLE',
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
      image: config?.slide1_image || '/images/slides/slide-1.png',
      eyebrow: config?.slide1_eyebrow || 'DISCOVER YOUR NEXT RIDE · 2026',
      titleWhite: config?.slide1_titleWhite || 'RIDE BEYOND.',
      titleGold: config?.slide1_titleGold || 'LIVE FREEDOM.',
      description: config?.slide1_description || 'Entdecken Sie eine neue Art des Fahrens. Außergewöhnliche Fahrräder, entwickelt um Grenzen zu verschieben.',
      primaryCtaText: config?.slide1_cta1Text || 'Fahrräder entdecken',
      primaryCtaLink: config?.slide1_cta1Link || '/shop',
      secondaryCtaText: config?.slide1_cta2Text || 'Unsere Welt',
      secondaryCtaLink: config?.slide1_cta2Link || '/shop',
      tags: config?.slide1_tags || 'PERFORMANCE · DESIGN · FREIHEIT',
    },
    {
      id: 'slide-2',
      image: config?.slide2_image || '/images/slides/slide-2.jpg',
      eyebrow: config?.slide2_eyebrow || 'POWER & REVOLUTION · E-BIKES',
      titleWhite: config?.slide2_titleWhite || 'EXPLORE MORE.',
      titleGold: config?.slide2_titleGold || 'CONQUER PEAKS.',
      description: config?.slide2_description || 'Kraftvolle Bosch- & Shimano-Antriebe, grenzenlose Reichweite und maximale Souveränität auf jedem Trail.',
      primaryCtaText: config?.slide2_cta1Text || 'E-Bikes ansehen',
      primaryCtaLink: config?.slide2_cta1Link || '/shop?category=e-bike',
      secondaryCtaText: config?.slide2_cta2Text || 'Kaufberatung',
      secondaryCtaLink: config?.slide2_cta2Link || '/contact',
      tags: config?.slide2_tags || 'KRAFT · INNOVATION · REICHWEITE',
    },
    {
      id: 'slide-3',
      image: config?.slide3_image || '/images/slides/slide-3.jpg',
      eyebrow: config?.slide3_eyebrow || 'PRECISION ENGINEERING · GRAVEL & MTB',
      titleWhite: config?.slide3_titleWhite || 'PURE SPEED.',
      titleGold: config?.slide3_titleGold || 'EVERY ROAD.',
      description: config?.slide3_description || 'Vom Großstadtdschungel bis zum anspruchsvollen Singletrack – entwickelt für kompromisslose Präzision und Agilität.',
      primaryCtaText: config?.slide3_cta1Text || 'Gravel & MTB entdecken',
      primaryCtaLink: config?.slide3_cta1Link || '/shop?category=gravel',
      secondaryCtaText: config?.slide3_cta2Text || 'Zubehör ansehen',
      secondaryCtaLink: config?.slide3_cta2Link || '/shop?category=zubehoer',
      tags: config?.slide3_tags || 'PRÄZISION · AGILITÄT · KONTROLLE',
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
      className="relative w-full h-screen min-h-[660px] max-h-[980px] bg-stone-950 text-white overflow-hidden select-none"
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
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-between pt-32 sm:pt-40 lg:pt-48 pb-10 sm:pb-12">
        {/* Center / Left: Slide Typography & CTAs */}
        <div className="max-w-2xl lg:max-w-3xl my-auto">
          {/* Eyebrow / Tag */}
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
            <span className="text-[#F59E0B] font-bold tracking-[0.25em] text-xs sm:text-sm uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {activeSlide.eyebrow}
            </span>
          </div>

          {/* Giant Impact Headline */}
          <h1 className="font-black italic tracking-tight uppercase leading-[0.95] text-5xl sm:text-6xl md:text-7xl lg:text-[80px] drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
            <span className="block text-white transition-all duration-700 transform">
              {activeSlide.titleWhite}
            </span>
            <span className="block text-[#F59E0B] transition-all duration-700 transform">
              {activeSlide.titleGold}
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="mt-4 sm:mt-6 text-stone-100 text-sm sm:text-base md:text-lg max-w-xl font-normal leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
            {activeSlide.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mt-6 sm:mt-8">
            {/* Primary Solid Gold Pill Button */}
            <Link
              href={activeSlide.primaryCtaLink}
              className="inline-flex items-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#F59E0B] hover:bg-[#d97706] text-stone-950 font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 group"
            >
              <span>{activeSlide.primaryCtaText}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            {/* Secondary Transparent Border Pill Button */}
            <Link
              href={activeSlide.secondaryCtaLink}
              className="inline-flex items-center justify-center px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-black/25 hover:bg-white/15 text-white border border-white/60 hover:border-white font-bold text-xs sm:text-sm tracking-wider uppercase backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <span>{activeSlide.secondaryCtaText}</span>
            </Link>
          </div>
        </div>

        {/* Bottom Bar: Left Tags & Right Slider Pagination (Exact Mockup Match) */}
        <div className="flex items-end justify-between border-t border-white/15 pt-5 sm:pt-6 mt-6">
          {/* Bottom Left: Tagline */}
          <div className="text-stone-300 font-semibold tracking-[0.28em] text-[10px] sm:text-xs uppercase drop-shadow">
            {activeSlide.tags}
          </div>

          {/* Bottom Right: Slider Navigation (< > 01 / 03 < >) */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Slide Arrows & Counter */}
            <div className="flex items-center gap-2 text-white">
              {/* Prev Button */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Vorheriger Slide"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-[#F59E0B] hover:text-stone-950 border border-white/30 hover:border-[#F59E0B] text-white flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Slide Counter (01 / 03) */}
              <div className="px-2 font-mono text-sm sm:text-base font-bold flex items-center select-none">
                <span className="text-[#F59E0B] font-extrabold text-base sm:text-lg">
                  {String(currentIndex + 1).padStart(2, '0')}
                </span>
                <span className="text-white/40 mx-1.5 font-normal">/</span>
                <span className="text-white/70">
                  {String(totalSlides).padStart(2, '0')}
                </span>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Nächster Slide"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-[#F59E0B] hover:text-stone-950 border border-white/30 hover:border-[#F59E0B] text-white flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Quick-Jump Dots */}
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
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
