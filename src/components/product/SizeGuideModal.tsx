'use client';

import React from 'react';

type SizeGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📐</span>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Fahrrad-Größentabelle &amp; Rahmenberatung</h3>
              <p className="text-xs text-gray-500">Finden Sie die passende Rahmengröße für Ihre Körpergröße</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition cursor-pointer text-sm font-bold"
            title="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Size Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <th className="py-3 px-3">Rahmengröße</th>
                <th className="py-3 px-3">Körpergröße (cm)</th>
                <th className="py-3 px-3">Schrittlänge (cm)</th>
                <th className="py-3 px-3">Zoll-Angabe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr className="hover:bg-orange-50/40 transition">
                <td className="py-3 px-3 font-bold text-[#F28611]">XS</td>
                <td className="py-3 px-3">150 – 160 cm</td>
                <td className="py-3 px-3">65 – 70 cm</td>
                <td className="py-3 px-3 text-gray-500">13″ – 14″ (ca. 35 cm)</td>
              </tr>
              <tr className="hover:bg-orange-50/40 transition">
                <td className="py-3 px-3 font-bold text-[#F28611]">S</td>
                <td className="py-3 px-3">160 – 170 cm</td>
                <td className="py-3 px-3">70 – 76 cm</td>
                <td className="py-3 px-3 text-gray-500">15″ – 16″ (ca. 40 cm)</td>
              </tr>
              <tr className="hover:bg-orange-50/40 transition">
                <td className="py-3 px-3 font-bold text-[#F28611]">M</td>
                <td className="py-3 px-3">170 – 180 cm</td>
                <td className="py-3 px-3">76 – 82 cm</td>
                <td className="py-3 px-3 text-gray-500">17″ – 18″ (ca. 45 cm)</td>
              </tr>
              <tr className="hover:bg-orange-50/40 transition">
                <td className="py-3 px-3 font-bold text-[#F28611]">L</td>
                <td className="py-3 px-3">180 – 190 cm</td>
                <td className="py-3 px-3">82 – 88 cm</td>
                <td className="py-3 px-3 text-gray-500">19″ – 20″ (ca. 50 cm)</td>
              </tr>
              <tr className="hover:bg-orange-50/40 transition">
                <td className="py-3 px-3 font-bold text-[#F28611]">XL</td>
                <td className="py-3 px-3">190 – 200 cm</td>
                <td className="py-3 px-3">88 – 94 cm</td>
                <td className="py-3 px-3 text-gray-500">21″ – 22″ (ca. 55 cm)</td>
              </tr>
              <tr className="hover:bg-orange-50/40 transition">
                <td className="py-3 px-3 font-bold text-[#F28611]">XXL</td>
                <td className="py-3 px-3">&gt; 198 cm</td>
                <td className="py-3 px-3">&gt; 94 cm</td>
                <td className="py-3 px-3 text-gray-500">23″+ (ca. 60 cm)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tip Box */}
        <div className="bg-orange-50 border border-orange-200/80 rounded-xl p-4 text-xs text-orange-900 leading-relaxed mb-6">
          <p className="font-bold mb-1 flex items-center gap-1.5">
            <span>💡</span> Tipp für die perfekte Wahl:
          </p>
          <p>
            Wenn Sie zwischen zwei Rahmengrößen liegen: Für ein sportlicheres und agileres Fahrverhalten wählen Sie die kleinere Größe. Für mehr Laufruhe und Komfort auf langen Touren wählen Sie die nächstgrößere Rahmengröße.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#0B131E] hover:bg-[#162032] text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer"
        >
          Verstanden, zurück zum Fahrrad
        </button>
      </div>
    </div>
  );
}
