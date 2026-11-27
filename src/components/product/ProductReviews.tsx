'use client';

import { useState } from 'react';
import { submitReview } from '@/actions/reviews';
import { useTranslations, useLocale } from 'next-intl';
import SafeHTML from '@/components/SafeHTML';

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  reviewerName?: string | null;
};

type ProductReviewsProps = {
  productId: string;
  productTitle?: string;
  reviews: Review[];
  description?: string | null;
  isLoggedIn: boolean;
};

const Star = ({ filled = true }: { filled?: boolean }) => (
  <svg 
    className={`w-4 h-4 ${filled ? 'text-[#F28611]' : 'text-gray-300'}`} 
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function ProductReviews({ productId, productTitle, reviews, description, isLoggedIn }: ProductReviewsProps) {
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const t = useTranslations('Product');
  const locale = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const res = await submitReview(productId, rating, comment);
    
    if (res.error) {
      setMsg({ type: 'error', text: res.error });
    } else {
      setMsg({ type: 'success', text: t('review_submitted') });
      setComment('');
      setRating(5);
    }
    setLoading(false);
  };

  return (
    <div id="details-section" className="mt-14 sm:mt-20 scroll-mt-24">
      {/* Tab Switcher */}
      <div className="flex justify-center gap-2 mb-0 relative z-10">
        <button 
          onClick={() => setActiveTab('desc')}
          className={`px-6 sm:px-10 py-3 text-xs sm:text-sm font-bold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'desc' 
              ? 'bg-[#F28611] text-white shadow-sm' 
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          {t('description_tab')} &amp; Spezifikationen
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`px-6 sm:px-10 py-3 text-xs sm:text-sm font-bold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'reviews' 
              ? 'bg-[#F28611] text-white shadow-sm' 
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          {t('reviews_tab', { count: reviews.length })}
        </button>
      </div>

      {/* Tab Content Box */}
      <div className="w-full border border-gray-200 rounded-2xl p-5 sm:p-10 bg-[#fafafa] shadow-2xs">
        {activeTab === 'desc' ? (
          <div className="text-sm text-gray-700 leading-relaxed space-y-6">
            {description ? (
              <div className="w-full overflow-x-auto">
                <SafeHTML 
                  html={description}
                  className="prose prose-sm max-w-none w-full whitespace-normal" 
                />
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{t('no_description')}</div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Reviews List */}
            <div>
              <h3 className="text-base font-bold mb-3 text-gray-900">
                {t('customer_reviews_title')} {reviews.length > 0 ? `(${reviews.length})` : ''}
              </h3>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-xs">{t('no_reviews_yet')}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-200 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} filled={i <= review.rating} />
                          ))}
                        </div>
                        <span className="font-semibold text-xs text-gray-900">
                          {review.reviewerName || 'Kunde'}
                        </span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-gray-400 text-xs">
                          {new Date(review.createdAt).toLocaleDateString(locale === 'de' ? 'de-DE' : 'de-DE')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed mt-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Review */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-base font-bold mb-1 text-gray-900">
                {t('add_review')}
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                {t('be_first_to_review', { name: productTitle || '' })}. {t('email_not_published')}
              </p>

              {msg.text && (
                <div className={`p-4 rounded-xl text-xs mb-6 ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {msg.text}
                </div>
              )}

              {!isLoggedIn ? (
                <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
                  <p className="text-xs text-gray-600 mb-3">{t('must_be_logged_in')}</p>
                  <a href="/login" className="inline-block bg-[#0B131E] hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-colors">
                    {t('login')}
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t('your_rating_text')} *</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="text-gray-300 hover:text-[#F28611] focus:outline-none cursor-pointer transition-colors"
                        >
                          <svg 
                            className={`w-6 h-6 ${star <= rating ? 'text-[#F28611]' : 'text-gray-300'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Comment */}
                  <div>
                    <textarea 
                      required
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F28611] focus:border-transparent outline-none text-sm text-gray-700 bg-white"
                      placeholder={t('your_review_placeholder')}
                    ></textarea>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-[#F28611] text-white font-bold py-3 px-8 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm shadow-xs cursor-pointer"
                    >
                      {loading ? t('sending') : t('submit_review')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
