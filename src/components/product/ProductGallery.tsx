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

  // Ref for auto-scrolling mobile thumbnail strip
  const mobileThumbnailsRef = useRef<HTMLDivElement>(null);

  // Max start index for the 5-item sliding window
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

  // Keep window in sync if selectedIndex is changed directly
  const handleSelectThumbnail = (idx: number) => {
    setSelectedIndex(idx);
    if (idx < startIndex) {
      setStartIndex(idx);
    } else if (idx >= startIndex + VISIBLE_COUNT) {
      setStartIndex(Math.min(maxStartIndex, idx - VISIBLE_COUNT + 1));
    }
  };

  // Next arrow: advances selected index and scrolls the 5-item window
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

  // Prev arrow: moves back and scrolls the 5-item window
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

  // Mouse wheel over thumbnails
  const handleThumbnailsWheel = (e: React.WheelEvent) => {
    if (!hasImages || images.length <= VISIBLE_COUNT) return;
    if (e.deltaY > 0) {
      if (startIndex < maxStartIndex) {
        setStartIndex(prev => Math.min(maxStartIndex, prev + 1));
      }
    } else if (e.deltaY < 0) {
      if (startIndex > 0) {
        setStartIndex(prev => Math.max(0, prev - 1));
      }
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

  // Up/Down button disabled states
  const isUpDisabled = !hasImages || (selectedIndex === 0 && startIndex === 0);
  const isDownDisabled = !hasImages || (selectedIndex >= images.length - 1 && startIndex >= maxStartIndex);

  return (
    <>
      <div className="w-full lg:w-1/2 flex flex-col-reverse lg:flex-row gap-3 sm:gap-4 lg:items-start lg:self-start lg:sticky lg:top-8">
        
        {/* DESKTOP THUMBNAILS (Vertical 5-Item Carousel Window) */}
        <div 
          className="hidden lg:flex flex-col items-center w-20 shrink-0 select-none"
          onWheel={handleThumbnailsWheel}
        >
          {/* Desktop Up Arrow */}
          <button 
            type="button"
            onClick={handlePrev}
            disabled={isUpDisabled}
            aria-label="Foto anterior"
            className="w-full py-1.5 mb-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-red-50 hover:text-red-600 hover:border-red-500 flex justify-center items-center disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-700 disabled:hover:border-stone-300 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          {/* Fixed 5-Item Viewport (Height = 5 * 80px + 4 * 10px = 440px) */}
          <div className="w-20 h-[440px] overflow-hidden relative">
            {hasImages ? (
              <div 
                className="flex flex-col gap-2.5 transition-transform duration-300 ease-out"
                style={{ transform: `translateY(-${startIndex * 90}px)` }}
              >
                {images.map((img, idx) => (
                  <button 
                    type="button"
                    key={idx} 
                    onClick={() => handleSelectThumbnail(idx)}
                    aria-label={`Ver foto ${idx + 1}`}
                    className={`border-2 rounded-xl overflow-hidden cursor-pointer h-20 w-20 shrink-0 transition-all bg-stone-50 p-1 flex items-center justify-center ${
                      idx === selectedIndex 
                        ? 'border-red-600 ring-2 ring-red-500/30 scale-102 shadow-xs' 
                        : 'border-stone-200 hover:border-stone-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Image 
                      width={120} 
                      height={120} 
                      src={img} 
                      alt={`${title} - Miniatura ${idx + 1}`} 
                      title={`${title} - Miniatura ${idx + 1}`} 
                      className="w-full h-full object-contain" 
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="border-2 border-stone-200 rounded-xl h-20 w-20 bg-stone-100 flex items-center justify-center text-xl shrink-0">
                🔥
              </div>
            )}
          </div>
          
          {/* Desktop Down Arrow */}
          <button 
            type="button"
            onClick={handleNext}
            disabled={isDownDisabled}
            aria-label="Próxima foto"
            className="w-full py-1.5 mt-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-red-50 hover:text-red-600 hover:border-red-500 flex justify-center items-center disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-700 disabled:hover:border-stone-300 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* MOBILE THUMBNAILS (Horizontal Swipe Strip) */}
        <div 
          ref={mobileThumbnailsRef}
          className="flex lg:hidden gap-2 overflow-x-auto no-scrollbar py-1 w-full shrink-0"
        >
          {hasImages ? (
            images.map((img, idx) => (
              <button 
                type="button"
                key={idx} 
                onClick={() => handleSelectThumbnail(idx)}
                aria-label={`Ver foto ${idx + 1}`}
                className={`border-2 rounded-xl overflow-hidden cursor-pointer h-16 w-16 shrink-0 transition-all bg-stone-50 p-1 flex items-center justify-center ${
                  idx === selectedIndex 
                    ? 'border-red-600 ring-2 ring-red-500/30' 
                    : 'border-stone-200 hover:border-stone-400 opacity-75'
                }`}
              >
                <Image 
                  width={100} 
                  height={100} 
                  src={img} 
                  alt={`${title} - Miniatura ${idx + 1}`} 
                  title={`${title} - Miniatura ${idx + 1}`} 
                  className="w-full h-full object-contain" 
                />
              </button>
            ))
          ) : (
            <div className="border-2 border-stone-200 rounded-xl h-16 w-16 bg-stone-100 flex items-center justify-center text-xl shrink-0">
              🔥
            </div>
          )}
        </div>

        {/* MAIN LARGE IMAGE CONTAINER (Strict Aspect-Square to Prevent Vertical Elongation) */}
        <div className="flex-1 w-full border border-stone-200/90 rounded-2xl relative overflow-hidden flex items-center justify-center bg-white aspect-square shadow-sm">
          {discountLabel && compareAtPrice && price && compareAtPrice > price && (
            <span className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 bg-red-600 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md z-10 shadow-sm pointer-events-none">
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
              className="absolute top-3.5 right-3.5 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-red-600 shadow-md border border-stone-200 flex items-center justify-center transition-all hover:scale-110 cursor-pointer backdrop-blur-xs group/zoom"
              title="Ampliar foto (Zoom)"
              aria-label="Ampliar foto"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover/zoom:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
          )}

          {/* Mobile Image Counter Pill */}
          {hasImages && images.length > 1 && (
            <span className="lg:hidden absolute bottom-3 right-3 bg-stone-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 backdrop-blur-sm pointer-events-none">
              {selectedIndex + 1} / {images.length}
            </span>
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
                width={900} 
                height={900} 
                src={mainImage} 
                alt={title} 
                title={title} 
                priority
                className="w-full h-full object-contain p-4 sm:p-6 transition-transform duration-150 ease-out select-none pointer-events-none" 
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: isHoverZoomActive ? 'scale(2.2)' : 'scale(1)',
                }}
              />

              {/* Subtle hover zoom hint on desktop */}
              {!isHoverZoomActive && (
                <div className="hidden lg:flex items-center gap-1.5 absolute bottom-3 left-3 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-stone-200 text-[11px] font-medium text-stone-500 pointer-events-none transition-opacity opacity-75">
                  <svg className="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Passe o cursor para ampliar</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-7xl text-stone-300">🔥</div>
          )}
        </div>

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
            <div className="text-xs sm:text-sm font-semibold text-stone-300 bg-stone-900/80 px-3.5 py-1.5 rounded-full border border-stone-700/70 backdrop-blur-sm max-w-[65vw] truncate">
              {title} &bull; <span className="text-white font-bold">{selectedIndex + 1} / {images.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalZoomed(prev => !prev)}
                className="p-2 sm:p-2.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-white transition cursor-pointer border border-stone-700 flex items-center justify-center"
                title={isModalZoomed ? "Reduzir zoom" : "Ampliar zoom"}
                aria-label="Alternar zoom"
              >
                {isModalZoomed ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 sm:p-2.5 rounded-full bg-stone-800/80 hover:bg-red-600 text-white transition cursor-pointer border border-stone-700 flex items-center justify-center"
                title="Fechar (Esc)"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lightbox Prev Button */}
          {hasImages && images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              disabled={selectedIndex === 0}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer shadow-lg"
              aria-label="Foto anterior"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Lightbox Center Image */}
          <div 
            className={`relative max-w-5xl max-h-[72vh] w-full h-full flex items-center justify-center overflow-hidden transition-all duration-300 ${isModalZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsModalZoomed(prev => !prev);
            }}
          >
            <img
              src={mainImage}
              alt={title}
              className={`max-w-full max-h-full object-contain transition-transform duration-300 select-none ${isModalZoomed ? 'scale-150' : 'scale-100'}`}
            />
          </div>

          {/* Lightbox Next Button */}
          {hasImages && images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              disabled={selectedIndex === images.length - 1}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer shadow-lg"
              aria-label="Próxima foto"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Bottom Thumbnails Navigation Strip */}
          {hasImages && images.length > 1 && (
            <div 
              className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[92vw] overflow-x-auto no-scrollbar flex items-center gap-2 p-2 bg-stone-900/85 rounded-2xl border border-stone-700/80 backdrop-blur-md z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectThumbnail(idx)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all p-0.5 bg-stone-800 ${
                    idx === selectedIndex 
                      ? 'border-red-500 ring-2 ring-red-400 scale-105' 
                      : 'border-stone-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
