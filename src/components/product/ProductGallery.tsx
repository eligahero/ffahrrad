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

  // Zoom & Loupe states
  const [isHoverZoomActive, setIsHoverZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalZoomed, setIsModalZoomed] = useState(false);

  // Ref to thumbnail scroll container
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);

  // When active variation image changes from parent, sync selectedIndex
  useEffect(() => {
    if (activeVariationImage && hasImages) {
      const idx = images.indexOf(activeVariationImage);
      if (idx !== -1) {
        setSelectedIndex(idx);
        scrollThumbnailIntoView(idx);
      }
    }
  }, [activeVariationImage, hasImages, images]);

  const scrollThumbnailIntoView = (idx: number) => {
    if (!thumbnailsContainerRef.current) return;
    const thumb = thumbnailsContainerRef.current.children[idx] as HTMLElement;
    if (thumb) {
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleSelectThumbnail = (idx: number) => {
    setSelectedIndex(idx);
    scrollThumbnailIntoView(idx);
  };

  const handleNext = () => {
    if (!hasImages) return;
    const nextIdx = selectedIndex < images.length - 1 ? selectedIndex + 1 : 0;
    handleSelectThumbnail(nextIdx);
  };

  const handlePrev = () => {
    if (!hasImages) return;
    const prevIdx = selectedIndex > 0 ? selectedIndex - 1 : images.length - 1;
    handleSelectThumbnail(prevIdx);
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

  // Main display image: strictly follows selectedIndex so user clicks ALWAYS work!
  const mainImage = hasImages ? images[selectedIndex] : (activeVariationImage || null);

  return (
    <>
      <div className="w-full h-full flex flex-col justify-between gap-3 sm:gap-4 select-none">

        {/* MAIN LARGE IMAGE CONTAINER WITH SIDE CHEVRONS (Auto-adjusts height to sibling column) */}
        <div className="w-full flex-1 aspect-[4/3] sm:aspect-square lg:aspect-auto min-h-[300px] sm:min-h-[360px] lg:min-h-0 border border-gray-200/90 rounded-2xl relative overflow-hidden flex items-center justify-center bg-white shadow-xs group">
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
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-14 sm:w-10 sm:h-16 rounded-r-xl bg-white/85 hover:bg-white text-gray-700 hover:text-[#F28611] border border-gray-200 shadow-md flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs active:scale-95"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-14 sm:w-10 sm:h-16 rounded-l-xl bg-white/85 hover:bg-white text-gray-700 hover:text-[#F28611] border border-gray-200 shadow-md flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs active:scale-95"
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
                className="w-full h-full max-h-full max-w-full object-contain p-4 sm:p-6 transition-transform duration-150 ease-out select-none pointer-events-none"
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

        {/* HORIZONTAL THUMBNAILS STRIP WITH CHEVRONS */}
        {hasImages && images.length > 1 && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full shrink-0 pt-1">
            {/* Left Scroll Arrow */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Vorheriges Bild"
              className="h-16 w-8 sm:h-20 sm:w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-[#F28611] flex items-center justify-center transition cursor-pointer shrink-0 shadow-2xs active:scale-95"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Thumbnail Cards Container */}
            <div 
              ref={thumbnailsContainerRef}
              className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 px-0.5 max-w-full scroll-smooth"
            >
              {images.map((img, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelectThumbnail(idx)}
                    aria-label={`Bild ${idx + 1} auswählen`}
                    className={`h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-white p-1.5 flex items-center justify-center transition-all cursor-pointer shrink-0 overflow-hidden ${
                      isSelected
                        ? 'border-2 border-[#F28611] ring-2 ring-[#F28611]/30 shadow-xs scale-102'
                        : 'border border-gray-200 hover:border-gray-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image
                      width={100}
                      height={100}
                      src={img}
                      alt={`${title} - Miniaturansicht ${idx + 1}`}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Arrow */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Nächstes Bild"
              className="h-16 w-8 sm:h-20 sm:w-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-[#F28611] flex items-center justify-center transition cursor-pointer shrink-0 shadow-2xs active:scale-95"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      {isLightboxOpen && mainImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Controls */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsModalZoomed(!isModalZoomed)}
              className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
              <span>{isModalZoomed ? 'Verkleinern' : 'Vergrößern (2x)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer text-lg font-bold"
              title="Schließen (ESC)"
            >
              ✕
            </button>
          </div>

          {/* Chevrons in Lightbox */}
          {hasImages && images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-16 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
                title="Vorheriges Bild (Pfeiltaste links)"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-16 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
                title="Nächstes Bild (Pfeiltaste rechts)"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Lightbox Center Image */}
          <div 
            className={`relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center overflow-auto ${
              isModalZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsModalZoomed(!isModalZoomed);
            }}
          >
            <Image
              width={1600}
              height={1600}
              src={mainImage}
              alt={title}
              className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
                isModalZoomed ? 'scale-175 sm:scale-200' : 'scale-100'
              }`}
            />
          </div>

          {/* Lightbox Footer Index Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-xs text-white text-xs px-4 py-1.5 rounded-full font-medium">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
