'use client';

import { useState } from 'react';
import ProductGallery from './ProductGallery';
import ProductActions from './ProductActions';

const Star = ({ filled = true }: { filled?: boolean }) => (
  <svg
    className={`w-4 h-4 ${filled ? 'text-[#F28611]' : 'text-gray-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

interface ProductPageClientProps {
  product: {
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    discountLabel?: string | null;
    type: string;
    stock: number | null;
    images: string[];
    attributes?: { name: string; options: string[] }[];
    variations?: { id: string; price: string; stock?: string; image?: string; attributes: Record<string, string> }[];
    brand?: { id?: string; name: string; logo?: string | null } | null;
    categories?: { id: string; name: string; slug?: string }[];
    tags?: { id?: string; name: string; slug?: string }[];
    reviews?: { rating: number }[];
    forceSales?: any[];
    saleTogether?: any[];
    gtin?: string | null;
    [key: string]: any;
  };
  colorVariants?: Array<{
    id: string;
    title: string;
    slug: string;
    colorName: string;
    image: string | null;
    price: number;
    compareAtPrice?: number | null;
    isCurrent?: boolean;
  }>;
  enableBuyNow?: boolean;
  storeName?: string;
  translations?: {
    sku: string;
    categories: string;
    tags: string;
    sold: string;
    customer_reviews: string;
    uncategorized: string;
    brand: string;
  };
  shippingInfo?: string[];
  contactSlug?: string;
}

export default function ProductPageClient({ 
  product, 
  colorVariants = [],
  enableBuyNow = false, 
  shippingInfo, 
  contactSlug = 'contact' 
}: ProductPageClientProps) {
  // Active variation image drives gallery preview
  const [variationImage, setVariationImage] = useState<string | null>(null);

  const reviews = product.reviews || [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / reviews.length
    : 0;

  return (
    <div className="w-full flex flex-col">
      {/* 1. Main Product Title at the top across the screen (matching reference layout) */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B131E] tracking-tight leading-tight">
          {product.title}
        </h1>

        {reviews.length > 0 && (
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} filled={i <= Math.round(avgRating)} />)}
              </div>
              <span className="ml-1 text-gray-700 font-semibold">
                {reviews.length} {reviews.length === 1 ? 'Kundenbewertung' : 'Kundenbewertungen'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Hero 2-Column Section: Gallery on Left, Buy Box Card on Right (Synchronized Height) */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 lg:items-stretch">
        {/* Left Column: Gallery */}
        <div className="w-full lg:w-7/12 flex flex-col">
          <ProductGallery
            images={product.images}
            title={product.title}
            discountLabel={product.discountLabel}
            compareAtPrice={product.compareAtPrice}
            price={product.price}
            activeVariationImage={variationImage}
          />
        </div>

        {/* Right Column: Buy Box Card */}
        <div className="w-full lg:w-5/12 flex flex-col">
          <ProductActions
            product={product as any}
            colorVariants={colorVariants}
            enableBuyNow={enableBuyNow}
            onVariationChange={(image: string | null) => setVariationImage(image)}
            shippingInfo={shippingInfo}
            contactSlug={contactSlug}
          />
        </div>
      </div>
    </div>
  );
}
