'use client';

import React, { useState } from 'react';
import { SectionConfig } from '@/app/admin/(dashboard)/landing/LandingForm';
import ImageFramePicker from '@/components/admin/ImageFramePicker';

interface HeroSectionEditorProps {
  section: SectionConfig;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  updateSectionSettings: (id: string, keyOrUpdates: string | Record<string, any>, value?: any) => void;
  handleUpload: (id: string, key: string) => void;
  editingBlockNum?: number;
}

export default function HeroSectionEditor({
  section,
  updateSectionSettings,
  handleUpload,
}: HeroSectionEditorProps) {
  const [activeSlideTab, setActiveSlideTab] = useState<'1' | '2' | '3'>('1');
  const settings = section.settings || {};

  const handleFieldChange = (key: string, value: any) => {
    updateSectionSettings(section.id, key, value);
  };

  const slidesData = [
    {
      num: '1' as const,
      title: 'Slide 1 (Haupt-Banner: E-Bikes & All-Terrain)',
      desc: 'Erster Eindruck: Premium Fahrräder & E-Bikes 2026',
      defaultImage: '/images/slides/slide-1.png',
      defaultEyebrow: 'FAHRRAD FRANKE · PREMIUM E-BIKES & BIKES 2026',
      defaultTitleWhite: 'RIDE BEYOND.',
      defaultTitleGold: 'LIVE FREEDOM.',
      defaultDescription: 'Entdecken Sie unsere Premium E-Bikes, Mountainbikes und Gravel Bikes. Höchste Performance, Bosch Smart System und kompromisslose Fahrfreude.',
      defaultCta1Text: 'Fahrräder entdecken',
      defaultCta1Link: '/shop',
      defaultCta2Text: 'Top E-Bike Bestseller',
      defaultCta2Link: '/shop?category=e-bike',
      defaultTags: 'BOSCH SMART SYSTEM · SHIMANO · 2 JAHRE GARANTIE',
    },
    {
      num: '2' as const,
      title: 'Slide 2 (Power & E-Bikes: Bosch CX)',
      desc: 'Fokus auf Bosch Performance CX & 750 Wh Akku',
      defaultImage: '/images/slides/slide-2.jpg',
      defaultEyebrow: 'BOSCH PERFORMANCE CX · MAXIMALE REICHWEITE',
      defaultTitleWhite: 'VOLLE POWER.',
      defaultTitleGold: 'JEDER TRAIL.',
      defaultDescription: 'Bis zu 85 Nm Drehmoment und 750 Wh Akkukapazität für steilste Anstiege und ausgedehnte Touren ohne Reichweitenangst.',
      defaultCta1Text: 'E-Bikes ansehen',
      defaultCta1Link: '/shop?category=e-bike',
      defaultCta2Text: 'Kaufberatung & Kontakt',
      defaultCta2Link: '/contact',
      defaultTags: '85 NM DREHMOMENT · 750 WH AKKU · FAHRBEREIT GELIEFERT',
    },
    {
      num: '3' as const,
      title: 'Slide 3 (Gravel & Mountainbike: Speed & Agilität)',
      desc: 'Präzision & hydraulische Scheibenbremsen',
      defaultImage: '/images/slides/slide-3.jpg',
      defaultEyebrow: 'GRAVEL & MOUNTAINBIKE · HYDRAULISCHE SCHEIBENBREMSEN',
      defaultTitleWhite: 'PURE GESCHWINDIGKEIT.',
      defaultTitleGold: 'MAXIMALE KONTROLLE.',
      defaultDescription: 'Leichte Rahmen, präzise Schaltungen und robuste 29-Zoll-Bereifung für Straße, Schotter und anspruchsvolle Singletrails.',
      defaultCta1Text: 'Gravel & MTB entdecken',
      defaultCta1Link: '/shop?category=mountainbike',
      defaultCta2Text: 'Zubehör & Helme',
      defaultCta2Link: '/shop?category=zubehoer',
      defaultTags: 'SHIMANO DEORE · 29 ZOLL LAUFRÄDER · TIEFPREISGARANTIE',
    },
  ];

  const currentSlide = slidesData.find((s) => s.num === activeSlideTab) || slidesData[0];
  const num = currentSlide.num;

  const imageKey = `slide${num}_image`;
  const eyebrowKey = `slide${num}_eyebrow`;
  const titleWhiteKey = `slide${num}_titleWhite`;
  const titleGoldKey = `slide${num}_titleGold`;
  const descKey = `slide${num}_description`;
  const cta1TextKey = `slide${num}_cta1Text`;
  const cta1LinkKey = `slide${num}_cta1Link`;
  const cta2TextKey = `slide${num}_cta2Text`;
  const cta2LinkKey = `slide${num}_cta2Link`;
  const tagsKey = `slide${num}_tags`;

  const currentValue = (key: string, defaultVal: string) => {
    return settings[key] !== undefined && settings[key] !== '' ? settings[key] : defaultVal;
  };

  return (
    <div className="flex flex-col h-full bg-white text-stone-800">
      {/* Editor Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/90">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Hero Slider (3 Slides)</h2>
            <p className="text-xs text-gray-500">
              Wählen Sie einen Slide aus, um Bild und Texte unabhängig voneinander anzupassen.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-orange-100 text-[#F28611] px-2.5 py-1 rounded-full">
            3 Slides
          </span>
        </div>

        {/* Slide Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 mt-3 bg-gray-200/70 p-1 rounded-xl">
          {slidesData.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveSlideTab(s.num)}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSlideTab === s.num
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Slide {s.num}
            </button>
          ))}
        </div>
      </div>

      {/* Slide Editor Form */}
      <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-220px)]">
        {/* Slide Title Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider block">
              {currentSlide.title}
            </span>
            <span className="text-[11px] text-gray-400">{currentSlide.desc}</span>
          </div>
        </div>

        {/* 1. Image Frame Picker with Pen (Edit) and Trash (Delete) */}
        <div>
          <ImageFramePicker
            label={`Hintergrundbild Slide ${num}`}
            sublabel="Frame anklicken zum Hinzufügen"
            value={settings[imageKey] !== undefined ? settings[imageKey] : currentSlide.defaultImage}
            onChange={(val) => handleFieldChange(imageKey, val)}
            onUpload={() => handleUpload(section.id, imageKey)}
            aspectRatio="16/9"
          />
        </div>

        {/* 2. Eyebrow Tag */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Eyebrow / Oberer Tag
          </label>
          <input
            type="text"
            value={currentValue(eyebrowKey, currentSlide.defaultEyebrow)}
            onChange={(e) => handleFieldChange(eyebrowKey, e.target.value)}
            placeholder={currentSlide.defaultEyebrow}
            className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#F28611] outline-none"
          />
        </div>

        {/* 3. Headlines: White Line & Gold Line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Titelzeile 1 (Weiß)
            </label>
            <input
              type="text"
              value={currentValue(titleWhiteKey, currentSlide.defaultTitleWhite)}
              onChange={(e) => handleFieldChange(titleWhiteKey, e.target.value)}
              placeholder={currentSlide.defaultTitleWhite}
              className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#F28611] outline-none font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Titelzeile 2 (Gold #F59E0B)
            </label>
            <input
              type="text"
              value={currentValue(titleGoldKey, currentSlide.defaultTitleGold)}
              onChange={(e) => handleFieldChange(titleGoldKey, e.target.value)}
              placeholder={currentSlide.defaultTitleGold}
              className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#F28611] outline-none font-bold text-[#F28611]"
            />
          </div>
        </div>

        {/* 4. Description Text */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Untertitel / Beschreibung
          </label>
          <textarea
            rows={2}
            value={currentValue(descKey, currentSlide.defaultDescription)}
            onChange={(e) => handleFieldChange(descKey, e.target.value)}
            placeholder={currentSlide.defaultDescription}
            className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#F28611] outline-none resize-none"
          />
        </div>

        {/* 5. Primary CTA (Button 1) */}
        <div className="p-3.5 bg-orange-50/40 border border-orange-100 rounded-2xl space-y-2.5">
          <span className="text-[11px] font-bold text-[#F28611] uppercase tracking-wider block">
            Haupt-Button (Goldene Pilule)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Text</label>
              <input
                type="text"
                value={currentValue(cta1TextKey, currentSlide.defaultCta1Text)}
                onChange={(e) => handleFieldChange(cta1TextKey, e.target.value)}
                placeholder={currentSlide.defaultCta1Text}
                className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F28611]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Ziel-URL</label>
              <input
                type="text"
                value={currentValue(cta1LinkKey, currentSlide.defaultCta1Link)}
                onChange={(e) => handleFieldChange(cta1LinkKey, e.target.value)}
                placeholder={currentSlide.defaultCta1Link}
                className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F28611]"
              />
            </div>
          </div>
        </div>

        {/* 6. Secondary CTA (Button 2) */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2.5">
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
            Zweiter Button (Transparente Umrandung)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Text</label>
              <input
                type="text"
                value={currentValue(cta2TextKey, currentSlide.defaultCta2Text)}
                onChange={(e) => handleFieldChange(cta2TextKey, e.target.value)}
                placeholder={currentSlide.defaultCta2Text}
                className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F28611]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Ziel-URL</label>
              <input
                type="text"
                value={currentValue(cta2LinkKey, currentSlide.defaultCta2Link)}
                onChange={(e) => handleFieldChange(cta2LinkKey, e.target.value)}
                placeholder={currentSlide.defaultCta2Link}
                className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F28611]"
              />
            </div>
          </div>
        </div>

        {/* 7. Bottom Tags */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Tags unten links
          </label>
          <input
            type="text"
            value={currentValue(tagsKey, currentSlide.defaultTags)}
            onChange={(e) => handleFieldChange(tagsKey, e.target.value)}
            placeholder={currentSlide.defaultTags}
            className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-1 focus:ring-[#F28611] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
