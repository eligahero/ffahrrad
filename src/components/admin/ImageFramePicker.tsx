'use client';

import React from 'react';
import Image from 'next/image';

interface ImageFramePickerProps {
  label?: string;
  sublabel?: string;
  value?: string;
  onChange: (url: string) => void;
  onUpload: () => void;
  aspectRatio?: '16/9' | '4/3' | 'video' | 'square';
}

export default function ImageFramePicker({
  label,
  sublabel,
  value,
  onChange,
  onUpload,
  aspectRatio = '16/9',
}: ImageFramePickerProps) {
  const hasImage = Boolean(value && value.trim() !== '');

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === '4/3'
      ? 'aspect-4/3'
      : 'aspect-16/9';

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            {label}
          </label>
          {sublabel && <span className="text-[11px] text-gray-400">{sublabel}</span>}
        </div>
      )}

      {hasImage ? (
        /* Image Preview Frame with Pen (Edit) and Trash (Delete) Controls */
        <div
          className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-stone-900 group select-none`}
        >
          <Image
            src={value!}
            alt={label || 'Slide Bild'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-102"
            sizes="(max-width: 768px) 100vw, 400px"
          />

          {/* Top-Right Action Controls (Pen & Trash) */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
            {/* Stylo / Edit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpload();
              }}
              title="Bild ändern / ersetzen"
              aria-label="Bild ändern"
              className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-gray-800 hover:text-[#F28611] shadow-lg flex items-center justify-center transition-all hover:scale-110 cursor-pointer border border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>

            {/* Corbeille / Delete Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title="Bild entfernen"
              aria-label="Bild entfernen"
              className="w-8 h-8 rounded-full bg-white/95 hover:bg-red-600 text-gray-800 hover:text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 cursor-pointer border border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          {/* Quick overlay indicator on hover */}
          <div
            onClick={onUpload}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors cursor-pointer flex items-end p-3"
          >
            <span className="text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Klicken zum Ändern
            </span>
          </div>
        </div>
      ) : (
        /* Empty State: Dotted Frame to Upload */
        <div
          onClick={onUpload}
          className={`w-full ${aspectClass} rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#F28611] bg-gray-50/80 hover:bg-orange-50/40 flex flex-col items-center justify-center p-4 transition-all duration-200 cursor-pointer group text-center select-none`}
        >
          <div className="w-10 h-10 rounded-full bg-white group-hover:bg-orange-100 flex items-center justify-center text-gray-400 group-hover:text-[#F28611] mb-2 shadow-xs transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-[#F28611] transition-colors">
            Bild auswählen oder hochladen
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">
            JPG, PNG, WebP (Empfohlen: 1920 × 1080)
          </span>
        </div>
      )}
    </div>
  );
}
