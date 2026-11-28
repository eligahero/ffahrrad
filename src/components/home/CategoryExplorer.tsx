import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CategoryExplorerProps {
  categories?: Array<{ id: string; name: string; slug: string | null }>;
}

const defaultCategories = [
  {
    name: 'E-Bikes & Pedelecs',
    href: '/shop?category=e-bike',
    image: 'https://res.cloudinary.com/ih3hdf0k/image/upload/v1794813594/lenha/woocommerce-import/mbdo02qlcq8uc12unml9.jpg',
    desc: 'Bosch & Shimano Motoren',
  },
  {
    name: 'Mountainbikes (MTB)',
    href: '/shop?category=mountainbike',
    image: 'https://res.cloudinary.com/ih3hdf0k/image/upload/v1794812720/lenha/woocommerce-import/flpbuaalghmbfshdjkqr.jpg',
    desc: 'Hardtail & Fully',
  },
  {
    name: 'Gravel & Rennräder',
    href: '/shop?category=gravel',
    image: 'https://res.cloudinary.com/ih3hdf0k/image/upload/v1794813533/lenha/woocommerce-import/usf8pcmofkklyigftxww.jpg',
    desc: 'Speed & All-Terrain',
  },
  {
    name: 'Trekking & City',
    href: '/shop?category=trekking',
    image: 'https://res.cloudinary.com/ih3hdf0k/image/upload/v1794813564/lenha/woocommerce-import/wh264zigeibfiyagsbel.jpg',
    desc: 'Komfort & Alltagstauglich',
  },
  {
    name: 'Lastenräder & Cargo',
    href: '/shop?category=cargo',
    image: 'https://res.cloudinary.com/ih3hdf0k/image/upload/v1794812720/lenha/woocommerce-import/flpbuaalghmbfshdjkqr.jpg',
    desc: 'Familie & Transport',
  },
  {
    name: 'Zubehör & Ausrüstung',
    href: '/shop?category=zubehoer',
    image: 'https://res.cloudinary.com/ih3hdf0k/image/upload/v1794813594/lenha/woocommerce-import/mbdo02qlcq8uc12unml9.jpg',
    desc: 'Helme, Beleuchtung & Schlösser',
  },
];

export default function CategoryExplorer({ categories }: CategoryExplorerProps) {
  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-3 mb-6 sm:mb-8">
        <div className="min-w-0">
          <span className="text-[#F28611] font-bold text-[11px] sm:text-xs uppercase tracking-wider block">
            Sortiment entdecken
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Kategorien durchstöbern
          </h2>
        </div>
        <Link 
          href="/shop" 
          className="text-xs sm:text-sm font-bold text-[#F28611] hover:text-[#D97706] flex items-center gap-1 shrink-0 transition-colors group pb-0.5"
        >
          <span>Alle Fahrräder ansehen</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {defaultCategories.map((cat, idx) => (
          <Link
            key={idx}
            href={cat.href}
            className="group relative bg-white rounded-2xl border border-stone-200/90 p-3 sm:p-4 hover:border-[#F28611] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center overflow-hidden"
          >
            {/* Real Product Image Container */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center p-1.5 sm:p-2 mb-2 sm:mb-3 group-hover:bg-orange-50/40 group-hover:border-orange-200 transition-colors">
              <Image
                src={cat.image}
                alt={cat.name}
                width={96}
                height={96}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            {/* Title & Description */}
            <h3 className="font-bold text-stone-900 text-xs sm:text-sm group-hover:text-[#F28611] transition-colors line-clamp-1">
              {cat.name}
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{cat.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
