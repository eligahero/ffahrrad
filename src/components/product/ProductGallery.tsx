'use client';

import { useState, useEffect, useRef } from 'react';
import Image from "next/image";

type ProductGalleryProps = {
  images: string[];
  title: string;
  discountLabel?: string | null;
  compareAtPrice?: number | null;
  price?: number;
  activeVariationImage?: string | null;
};

const VISIBLE_COUNT = 5;

export default function ProductGallery({
  images = [],
  title,
  discountLabel,
  compareAtPrice,
  price,
  activeVariationImage
}: ProductGalleryProps) {
  const hasImages = Array.isArray(images) && images.length > 0;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);

  // Zoom & Loupe states
  const [isHoverZoomActive, setIsHoverZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalZoomed, setIsModalZoomed] = useState(false);

  // Max start index for the sliding thumbnail window
  const maxStartIndex = Math.max(0, (images?.length || 0) - VISIBLE_COUNT);

  // When active variation image changes, select it and bring into view
  useEffect(() => {
    if (activeVariationImage && hasImages) {
      const idx = images.indexOf(activeVariationImage);
      if (idx !== -1) {
        setSelectedIndex(idx);
        if (idx < startIndex) {
          setStartIndex(idx);
        } else if (idx >= startIndex + VISIBLE_COUNT) {
          setStartIndex(Math.min(maxStartIndex, idx - VISIBLE_COUNT + 1));
        }
      } else {
        setSelectedIndex(0);
        setStartIndex(0);
      }
    }
  }, [activeVariationImage, hasImages, images, maxStartIndex]);

  const handleSelectThumbnail = (idx: number) => {
    setSelectedIndex(idx);
    if (idx < startIndex) {
      setStartIndex(idx);
    } else if (idx >= startIndex + VISIBLE_COUNT) {
      setStartIndex(Math.min(maxStartIndex, idx - VISIBLE_COUNT + 1));
    }
  };

  const handleNext = () => {
    if (!hasImages) return;
    if (selectedIndex < images.length - 1) {
      const nextIdx = selectedIndex + 1;
      setSelectedIndex(nextIdx);
      if (nextIdx >= startIndex + VISIBLE_COUNT) {
        setStartIndex(Math.min(maxStartIndex, nextIdx - VISIBLE_COUNT + 1));
      }
    } else if (startIndex < maxStartIndex) {
      setStartIndex(prev => Math.min(maxStartIndex, prev + 1));
    }
  };

  const handlePrev = () => {
    if (!hasImages) return;
    if (selectedIndex > 0) {
      const prevIdx = selectedIndex - 1;
      setSelectedIndex(prevIdx);
      if (prevIdx < startIndex) {
        setStartIndex(Math.max(0, prevIdx));
      }
    } else if (startIndex > 0) {
      setStartIndex(prev => Math.max(0, prev - 1));
    }
  };

  // Hover zoom coordinates tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  // Lock body scroll when Lightbox is open & listen for keyboard keys
  useEffect(() => {
    if (!isLightboxOpen) return;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, selectedIndex, images.length]);

  const mainImage = activeVariationImage || (hasImages ? images[selectedIndex] : null);

  const isPrevDisabled = !hasImages || selectedIndex === 0;
  const isNextDisabled = !hasImages || selectedIndex >= images.length - 1;

  return (
    <>
      <div className="w-full lg:w-7/12 flex flex-col gap-4 lg:sticky lg:top-8 self-start">

        {/* MAIN LARGE IMAGE CONTAINER WITH SIDE CHEVRONS */}
        <div className="w-full border border-gray-200/90 rounded-2xl relative overflow-hidden flex items-center justify-center bg-white aspect-square shadow-xs group">
          {discountLabel && compareAtPrice && price && compareAtPrice > price && (
            <span className="absolute top-4 left-4 bg-[#F28611] text-white text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full z-10 shadow-sm pointer-events-none">
              {discountLabel}
            </span>
          )}

          {/* LOUPE / ZOOM BUTTON (Top Right) */}
          {mainImage && (
            <button
              type="button"
              onClick={() => {
                setIsModalZoomed(false);
                setIsLightboxOpen(true);
              }}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-[#F28611] shadow-md border border-gray-200 flex items-center justify-center transition-all hover:scale-105 cursor-pointer backdrop-blur-xs"
              title="Bild vergrößern (Zoom)"
              aria-label="Bild vergrößern"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
          )}

          {/* Left Navigation Chevron Button on Main Image */}
          {hasImages && images.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isPrevDisabled}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-14 sm:w-10 sm:h-16 rounded-r-xl bg-white/80 hover:bg-white text-gray-700 hover:text-[#F28611] border border-gray-200 shadow-md flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer backdrop-blur-xs"
              title="Vorheriges Bild"
              aria-label="Vorheriges Bild"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Right Navigation Chevron Button on Main Image */}
          {hasImages && images.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-14 sm:w-10 sm:h-16 rounded-l-xl bg-white/80 hover:bg-white text-gray-700 hover:text-[#F28611] border border-gray-200 shadow-md flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer backdrop-blur-xs"
              title="Nächstes Bild"
              aria-label="Nächstes Bild"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Interactive Hover Zoom Area */}
          {mainImage ? (
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair relative"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHoverZoomActive(true)}
              onMouseLeave={() => setIsHoverZoomActive(false)}
              onClick={() => {
                setIsModalZoomed(false);
                setIsLightboxOpen(true);
              }}
            >
              <Image
                width={1000}
                height={1000}
                src={mainImage}
                alt={title}
                title={title}
                priority
                className="w-full h-full object-contain p-4 sm:p-8 transition-transform duration-150 ease-out select-none pointer-events-none"
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: isHoverZoomActive ? 'scale(2)' : 'scale(1)',
                }}
              />

              {!isHoverZoomActive && (
                <div className="flex items-center gap-1.5 absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full border border-gray-200 text-[11px] font-medium text-gray-600 pointer-events-none shadow-2xs">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Mauszeiger zum Vergrößern bewegen</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-7xl text-gray-300">🚲</div>
          )}
        </div>

        {/* HORIZONTAL THUMBNAILS STRIP WITH CHEVRONS (Exactly like the reference image) */}
        {hasImages && images.length > 1 && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full py-1">
            {/* Left Scroll Arrow */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={isPrevDisabled}
              aria-label="Vorheriges Bild"
              className="h-16 w-8 sm:h-20 sm:w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer shrink-0 shadow-2xs"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Thumbnail Cards Container */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 px-0.5 max-w-full">
              {images.map((img, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelectThumbnail(idx)}
                    aria-label={`Bild ${idx + 1} auswählen`}
                    className={`h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-white p-1.5 flex items-center justify-center transition-all cursor-pointer shrink-0 overflow-hidden ${isSelected
                        ? 'border-2 border-[#F28611] ring-2 ring-[#F28611]/25 shadow-xs scale-102'
                        : 'border border-gray-200 hover:border-gray-400 opacity-75 hover:opacity-100'
                      }`}
                  >
                    <Image
                      width={100}
                      height={100}
                      src={img}
                      alt={`${title} - Miniaturansicht ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Arrow */}
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled}
              aria-label="Nächstes Bild"
              className="h-16 w-8 sm:h-20 sm:w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer shrink-0 shadow-2xs"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL WITH ZOOM */}
      {isLightboxOpen && mainImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Top Bar */}
          <div
            className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs sm:text-sm font-semibold text-gray-300 bg-gray-900/80 px-4 py-2 rounded-full border border-gray-700/70 backdrop-blur-sm max-w-[65vw] truncate">
              {title} &bull; <span className="text-white font-bold">{selectedIndex + 1} / {images.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalZoomed(prev => !prev)}
                className="w-10 h-10 rounded-full bg-gray-800/90 hover:bg-gray-700 text-white flex items-center justify-center border border-gray-600 transition cursor-pointer"
                title={isModalZoomed ? "Verkleinern" : "Vergrößern"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isModalZoomed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  )}
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-800/90 hover:bg-red-600 text-white flex items-center justify-center border border-gray-600 transition cursor-pointer"
                title="Schließen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Navigation Chevrons */}
          {hasImages && images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                disabled={isPrevDisabled}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gray-900/80 hover:bg-gray-800 text-white border border-gray-700 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer shadow-lg"
                title="Vorheriges Bild"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                disabled={isNextDisabled}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gray-900/80 hover:bg-gray-800 text-white border border-gray-700 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer shadow-lg"
                title="Nächstes Bild"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Modal Image */}
          <div
            className="w-full h-full max-w-5xl max-h-[82vh] flex items-center justify-center overflow-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              width={1600}
              height={1600}
              src={mainImage}
              alt={title}
              className={`max-w-full max-h-full object-contain transition-transform duration-200 select-none ${isModalZoomed ? 'scale-175 cursor-zoom-out' : 'cursor-zoom-in'
                }`}
              onClick={() => setIsModalZoomed(prev => !prev)}
            />
          </div>
        </div>
      )}
    </>
  );
}
