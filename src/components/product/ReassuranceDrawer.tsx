'use client';

import React, { useEffect } from 'react';

type ReassuranceDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ReassuranceDrawer({ isOpen, onClose }: ReassuranceDrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (Sliding in from the Right) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside 
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-gray-200"
          role="dialog"
          aria-modal="true"
          aria-label="Ihre Einkaufsvorteile & Service-Garantie"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-[#0B131E] text-white flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F28611] text-white flex items-center justify-center font-black text-base shadow-sm">
                ★
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  Ihre Einkaufsvorteile
                </h3>
                <p className="text-xs text-orange-200/80 font-medium">
                  Service &amp; Garantien bei Fahrrad Franke
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer text-sm font-bold"
              title="Schließen"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          {/* Content: The 4 Reassurance Points with Detailed Explanations */}
          <div className="px-6 py-6 overflow-y-auto space-y-5 flex-1 bg-stone-50/60 divide-y divide-gray-100">
            
            {/* Point 1: Lieferzeit */}
            <div className="pt-1 first:pt-0">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F28611] flex items-center justify-center shrink-0 border border-orange-200 shadow-2xs mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                    Lieferzeit 2-4 Werktage deutschlandweit
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Alle lagernden Fahrräder und Zubehörteile werden innerhalb von 24 Stunden versandfertig gemacht. Sie erhalten sofort nach Warenausgang einen Tracking-Link zur Live-Sendungsverfolgung.
                  </p>
                  <ul className="mt-2 space-y-1 text-[11px] text-gray-500 font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="text-[#16A34A] font-bold">✓</span> Fachmännische Vormontage &amp; Endkontrolle
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-[#16A34A] font-bold">✓</span> Schneller Versand mit DHL oder Spedition
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Point 2: Kostenloser Speditionsversand */}
            <div className="pt-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0284C7] flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M12 3a14 14 0 014 9 14 14 0 01-4 9 14 14 0 01-4-9 14 14 0 014-9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                    Kostenloser Speditionsversand ab 150 €
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Ab einem Einkaufswert von 150 € übernehmen wir die gesamten Speditions- und Lieferkosten für Sie. Fahrräder und Anhänger kommen sicher verpackt im Spezialkarton zu Ihnen.
                  </p>
                  <ul className="mt-2 space-y-1 text-[11px] text-gray-500 font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="text-[#16A34A] font-bold">✓</span> Keine versteckten Sperrgut-Zuschläge
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-[#16A34A] font-bold">✓</span> 100% transportversicherte Zustellung
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Point 3: Terminankündigung */}
            <div className="pt-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                    Sichere Lieferung mit Terminankündigung
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Keine Überraschung bei der Zustellung: Unser Speditionspartner meldet sich vorab telefonisch oder per SMS bei Ihnen, um das genaue Zeitfenster der Anlieferung abzustimmen.
                  </p>
                  <ul className="mt-2 space-y-1 text-[11px] text-gray-500 font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="text-[#16A34A] font-bold">✓</span> Wunschtermin-Absprache vor Anlieferung
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-[#16A34A] font-bold">✓</span> Persönliche Übergabe an der Haustür
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Point 4: Rückgaberecht & Garantie */}
            <div className="pt-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                    30 Tage Rückgaberecht &amp; 2 Jahre Garantie
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Testen Sie Ihr Rad in Ruhe: Sie profitieren von vollen 30 Tagen Rückgaberecht mit unkomplizierter Retoure sowie 2 Jahren gesetzlicher Gewährleistung und voller Herstellergarantie.
                  </p>
                  <ul className="mt-2 space-y-1 text-[11px] text-gray-500 font-medium">
                    <li className="flex items-center gap-1.5">
                      <span className="text-[#16A34A] font-bold">✓</span> Kostenloser Rückversand bei Nichtgefallen
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-[#16A34A] font-bold">✓</span> Direkter Meister-Werkstattservice im Garantiefall
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Footer CTA */}
          <div className="p-5 border-t border-gray-200 bg-white space-y-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#F28611] hover:bg-orange-600 active:scale-98 text-white font-black py-3 px-6 rounded-xl transition shadow-md text-sm cursor-pointer"
            >
              Verstanden &amp; Weiter einkaufen
            </button>
            <p className="text-center text-[11px] text-gray-400">
              Fragen? Rufen Sie uns gerne an oder nutzen Sie das Kontaktformular.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
