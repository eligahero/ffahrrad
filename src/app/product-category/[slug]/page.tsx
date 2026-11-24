import { notFound, permanentRedirect } from 'next/navigation';
import { getCategoryCanonicalPath, getCachedAllCategories } from '@/lib/categories';

const isUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export default async function ProductCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug;
  const decodedSlug = decodeURIComponent(rawSlug);

  // Multi-Level Caching (Rule #3): Resolve category from in-memory cached hierarchy
  const allCats = await getCachedAllCategories();
  const category = allCats.find(c => 
    c.slug === decodedSlug || 
    c.slug === rawSlug || 
    (isUuid(rawSlug) && c.id === rawSlug)
  );

  if (!category) {
    notFound();
  }

  // Option B: Redirect /product-category/[slug] to the clean root-level path (e.g. /combustiveis/lenha-e-pellets)
  const canonicalPath = await getCategoryCanonicalPath(category, allCats);
  const resolvedSearchParams = await searchParams;
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    }
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  permanentRedirect(`${canonicalPath}${queryString}`);
}
