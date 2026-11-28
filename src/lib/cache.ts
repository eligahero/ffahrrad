import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

// ============================================================================
// ZERO-OVERBUDGET MINIMAL PROJECTIONS (Anti-Egress Rule #1)
// Never query description (heavy HTML), content, or attributes JSON on cards!
// ============================================================================
export const CARD_PRODUCT_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  images: true,
  discountLabel: true,
  type: true,
  isBestSeller: true,
  isDealOfTheDay: true,
  gtin: true,
  createdAt: true,
  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  categories: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  reviews: {
    select: {
      rating: true,
    },
  },
} as const;

export type CardProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  discountLabel: string | null;
  type?: string;
  isBestSeller?: boolean;
  isDealOfTheDay?: boolean;
  gtin?: string | null;
  createdAt?: Date;
  brand?: { id: string; name: string; slug: string | null } | null;
  categories: { id: string; name: string; slug: string | null }[];
  reviews: { rating: number }[];
};

export const CARD_ARTICLE_SELECT = {
  id: true,
  title: true,
  slug: true,
  image: true,
  category: true,
  excerpt: true,
  createdAt: true,
  _count: {
    select: {
      comments: { where: { isApproved: true } },
    },
  },
} as const;

// ============================================================================
// GLOBAL SETTINGS CACHE (Multi-Level Server Caching Rule #3 & Layout Rule #4)
// ============================================================================
const HIDDEN_SETTING_KEYS = new Set([
  'STRIPE_SECRET_KEY',
  'PAYPAL_SECRET',
  'CRON_SECRET',
  'SMTP_PASSWORD',
  'SMTP_PASS',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SETUP_TOKEN',
]);

async function fetchSettings(): Promise<Record<string, string>> {
  const settingsDb = await prisma.setting.findMany({
    select: {
      key: true,
      value: true,
    },
  });
  return settingsDb
    .filter(s => !HIDDEN_SETTING_KEYS.has(s.key))
    .reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
}

export const getCachedSettings = unstable_cache(
  async () => fetchSettings(),
  ['global-settings'],
  { tags: ['settings'], revalidate: 3600 }
);

// ============================================================================
// SINGLE PRODUCT DETAILS CACHE (Only place heavy fields like description are loaded)
// ============================================================================
export const getCachedProductBySlug = async (slug: string) => {
  return unstable_cache(
    async () => {
      const encodedSlugLower = encodeURIComponent(slug).toLowerCase();
      const encodedSlugUpper = encodeURIComponent(slug);
      let decodedSlug = slug;
      try { decodedSlug = decodeURIComponent(slug); } catch (e) {}

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

      let product = await prisma.product.findFirst({
        where: { 
          isDeleted: false,
          OR: [
            { slug: slug },
            { slug: encodedSlugLower },
            { slug: encodedSlugUpper },
            { slug: decodedSlug },
            ...(isUuid ? [{ id: slug }] : [])
          ]
        },
        include: {
          categories: true,
          Product_ForceSales_A: true,
          Product_SaleTogether_A: true,
          brand: true,
          tags: true,
          reviews: {
            where: { isApproved: true },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true } } }
          }
        }
      });

      // SEO Migration Fallback 1: Suffix appended during WP/WooCommerce import
      if (!product) {
        product = await prisma.product.findFirst({
          where: {
            isDeleted: false,
            slug: {
              startsWith: `${decodedSlug}-`
            }
          },
          include: {
            categories: true,
            Product_ForceSales_A: true,
            Product_SaleTogether_A: true,
            brand: true,
            tags: true,
            reviews: {
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              include: { user: { select: { email: true } } }
            }
          }
        });
      }

      // SEO Migration Fallback 2: Numeric suffix
      if (!product && /-\d+$/.test(decodedSlug)) {
        const strippedSlug = decodedSlug.replace(/-\d+$/, '');
        product = await prisma.product.findFirst({
          where: {
            isDeleted: false,
            slug: strippedSlug
          },
          include: {
            categories: true,
            Product_ForceSales_A: true,
            Product_SaleTogether_A: true,
            brand: true,
            tags: true,
            reviews: {
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              include: { user: { select: { email: true } } }
            }
          }
        });
      }

      if (!product) return null;

      // RGPD: Never leak raw emails to client RSC payload
      const sanitizedReviews = product.reviews.map(r => ({
        id: r.id,
        productId: r.productId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: r.reviewerName || (r.user?.email ? r.user.email.split('@')[0] : 'Client'),
      }));

      return {
        ...product,
        reviews: sanitizedReviews,
      };
    },
    ['product-details', slug],
    { tags: ['products', `product-${slug}`], revalidate: 3600 }
  )();
};

export const getCachedRelatedProducts = async (categoryIds: string[], excludeProductId: string) => {
  const sortedIds = [...categoryIds].sort();
  return unstable_cache(
    async () => prisma.product.findMany({
      where: { 
        categories: { some: { id: { in: categoryIds } } }, 
        id: { not: excludeProductId },
        isDeleted: false,
      },
      select: CARD_PRODUCT_SELECT,
      take: 4,
    }),
    ['related-products', sortedIds.join(','), excludeProductId],
    { tags: ['products'], revalidate: 3600 }
  )();
};

// ============================================================================
// COLOR SISTER VARIANTS CACHE (Matches sister bike models sharing base name)
// ============================================================================
export interface ColorVariantItem {
  id: string;
  title: string;
  slug: string;
  colorName: string;
  image: string | null;
  price: number;
  compareAtPrice?: number | null;
  isCurrent?: boolean;
}

export function extractColorFromTitle(title: string): string {
  const clean = title.replace(/[´`’]/g, "'");
  const cubeColorMatch = clean.match(/([a-zA-Z0-9]+'n'[a-zA-Z0-9]+)/i);
  if (cubeColorMatch) return cubeColorMatch[1];

  const finishMatch = clean.match(/\b(blackline|greylime|goldorange|whitenblack|allroad|desertstone|titanium|raw|neomint)\b/i);
  if (finishMatch) return finishMatch[1];

  const dashMatch = clean.match(/-\s*([A-Za-z0-9' ]+)$/);
  if (dashMatch) {
    const candidate = dashMatch[1].trim();
    if (!/^\d+\s*cm$/i.test(candidate) && !/^\d+\s*zoll$/i.test(candidate) && !/^\d{4}$/.test(candidate)) {
      return candidate;
    }
  }

  const words = clean.split(/\s+/);
  if (words.length >= 3) {
    const lastWord = words[words.length - 1];
    if (/^(black|white|grey|silver|blue|red|green|orange|yellow|mint|purple|bronze)$/i.test(lastWord)) {
      return lastWord;
    }
  }

  return '';
}

export function getBaseModelName(title: string): string {
  const color = extractColorFromTitle(title);
  if (color) {
    const clean = title.replace(/[´`’]/g, "'");
    const idx = clean.toLowerCase().indexOf(color.toLowerCase());
    if (idx !== -1) {
      return clean.slice(0, idx).trim().replace(/[-\s]+$/, '');
    }
  }
  const parts = title.split(' - ');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  const words = title.split(' ');
  return words.slice(0, Math.min(words.length, 3)).join(' ');
}

export const getCachedColorVariants = async (
  title: string, 
  currentProductId: string, 
  brandId?: string | null
): Promise<ColorVariantItem[]> => {
  return unstable_cache(
    async () => {
      try {
        const baseModel = getBaseModelName(title);
        if (!baseModel || baseModel.length < 4) return [];

        const matches = await prisma.product.findMany({
          where: {
            isDeleted: false,
            title: { startsWith: baseModel },
            ...(brandId ? { brandId } : {})
          },
          take: 6,
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
            price: true,
            compareAtPrice: true,
          }
        });

        if (matches.length <= 1) return [];

        return matches.map(m => {
          const colorName = extractColorFromTitle(m.title) || m.title.replace(baseModel, '').trim().replace(/^[-–\s]+/, '') || 'Standard';
          return {
            id: m.id,
            title: m.title,
            slug: m.slug,
            colorName,
            image: m.images?.[0] || null,
            price: m.price,
            compareAtPrice: m.compareAtPrice,
            isCurrent: m.id === currentProductId,
          };
        });
      } catch (err) {
        console.error('Error fetching color variants:', err);
        return [];
      }
    },
    ['color-variants', currentProductId],
    { tags: ['products'], revalidate: 3600 }
  )();
};

// ============================================================================
// BEST SELLERS & LATEST PRODUCTS (Cards only)
// ============================================================================
export const getCachedBestSellers = unstable_cache(
  async () => prisma.product.findMany({
    where: { isBestSeller: true, isDeleted: false },
    take: 8,
    select: CARD_PRODUCT_SELECT,
  }),
  ['home-best-sellers'],
  { tags: ['products'], revalidate: 3600 }
);

export const getCachedLatestProducts = unstable_cache(
  async () => prisma.product.findMany({
    where: { isDeleted: false },
    take: 8,
    orderBy: { createdAt: 'desc' },
    select: CARD_PRODUCT_SELECT,
  }),
  ['home-latest-products'],
  { tags: ['products'], revalidate: 3600 }
);

// ============================================================================
// SALE, HOT & NEW ARRIVALS CACHES
// ============================================================================
export const getCachedSaleProducts = unstable_cache(
  async (limit: number = 40) => {
    return prisma.product.findMany({
      where: {
        compareAtPrice: { not: null },
        isDeleted: false,
      },
      select: CARD_PRODUCT_SELECT,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  },
  ['catalog-sale-products'],
  { tags: ['products'], revalidate: 3600 }
);

export const getCachedHotProducts = unstable_cache(
  async (limit: number = 40) => {
    return prisma.product.findMany({
      where: { isDeleted: false },
      select: CARD_PRODUCT_SELECT,
      orderBy: {
        orderItems: {
          _count: 'desc',
        },
      },
      take: limit,
    });
  },
  ['catalog-hot-products'],
  { tags: ['products'], revalidate: 3600 }
);

export const getCachedNewArrivals = unstable_cache(
  async (limit: number = 24) => {
    return prisma.product.findMany({
      where: { isDeleted: false },
      select: CARD_PRODUCT_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
  ['catalog-new-arrivals'],
  { tags: ['products'], revalidate: 3600 }
);

// ============================================================================
// HOMEPAGE AGGREGATED CACHE (Zero DB Egress on repeat hits)
// ============================================================================
export const getCachedHomepageData = unstable_cache(
  async () => {
    const allDbProds = await prisma.product.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        images: true,
        discountLabel: true,
        isBestSeller: true,
        gtin: true,
        type: true,
        brand: { select: { name: true } },
        categories: { select: { name: true, slug: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedProducts = allDbProds.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images || [],
      discountLabel: p.discountLabel || (p.compareAtPrice && p.compareAtPrice > p.price ? `-${Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}%` : null),
      categorySlug: p.categories[0]?.slug || '',
      categoryName: p.categories[0]?.name || '',
      categories: p.categories.map(c => ({ name: c.name, slug: c.slug || '' })),
      allCategories: p.categories.map(c => `${c.name} ${c.slug}`).join(' '),
      type: p.type,
      reviews: p.reviews,
    }));

    const promoProducts = formattedProducts.filter(p =>
      (p.compareAtPrice && p.compareAtPrice > p.price) ||
      (p.discountLabel && p.discountLabel.trim() !== '')
    );

    const classify = (p: any) => {
      const t = p.title.toLowerCase();
      if (
        t.includes('salamandra') ||
        t.includes('recuperador') ||
        t.includes('lareira') ||
        t.includes('fogão') ||
        t.includes('fogao') ||
        t.includes('forno') ||
        t.includes('aquecedor') ||
        t.includes('radiador') ||
        t.includes('caldeira') ||
        t.includes('cozinha') ||
        t.includes('estufa')
      ) {
        return 'fireplaces';
      }
      if (
        t.includes('ar condicionado') ||
        t.includes('split') ||
        t.includes('climatiz') ||
        t.includes('desumidificador') ||
        t.includes('ventilador') ||
        t.includes('termoacumulador')
      ) {
        return 'climate';
      }
      if (
        t.includes('palete') ||
        t.includes('palet') ||
        t.includes('pellet') ||
        t.includes('lenha') ||
        t.includes('big bag') ||
        t.includes('aparas') ||
        t.includes('carvão') ||
        t.includes('carvao') ||
        t.includes('bioetanol') ||
        t.includes('combust')
      ) {
        return 'pallets';
      }
      return 'fireplaces';
    };

    const simulatorProducts = {
      pallets: [] as any[],
      fireplaces: [] as any[],
      climate: [] as any[],
    };

    for (const p of allDbProds) {
      const type = classify(p);
      simulatorProducts[type].push({
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: p.price,
        image: p.images?.[0] || '',
        categoryName: p.categories?.[0]?.name || '',
        brand: p.brand?.name || undefined,
        sku: p.gtin || undefined,
      });
    }

    const heroShowcaseProducts = formattedProducts
      .filter(p => p.images && p.images.length > 0)
      .slice(0, 8)
      .map(p => {
        const savings = p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice - p.price : 0;
        const discountPct = p.compareAtPrice && p.compareAtPrice > p.price
          ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
          : null;
        return {
          id: p.id,
          title: p.title,
          subtitle: p.categoryName ? `${p.categoryName} • Alta Eficiência EcoDesign` : 'Qualidade Garantida Silva Dias',
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          image: p.images[0],
          badge: discountPct ? `POUPANÇA -${discountPct}%` : 'TOP VENDAS',
          badgeTech: p.categoryName ? `🔥 ${p.categoryName}` : '🔥 Alto Rendimento',
          badgeTech2: savings > 0 ? `Poupe ${savings.toFixed(2).replace('.', ',')} €` : 'Stock Garantido',
          categoryName: p.categoryName || '',
        };
      });

    return {
      formattedProducts,
      promoProducts,
      simulatorProducts,
      heroShowcaseProducts,
    };
  },
  ['homepage-data'],
  { tags: ['products', 'homepage'], revalidate: 3600 }
);

// ============================================================================
// SHOP FILTERS METADATA CACHE (Categories with count, Brands with count, Price bounds)
// ============================================================================
export const getCachedShopFilterMetadata = unstable_cache(
  async () => {
    const [categories, brands, priceAgg] = await Promise.all([
      prisma.category.findMany({
        where: {
          products: { some: { isDeleted: false } },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { products: { where: { isDeleted: false } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.brand.findMany({
        where: {
          products: { some: { isDeleted: false } },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { products: { where: { isDeleted: false } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.product.aggregate({
        where: { isDeleted: false },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return {
      categories,
      brands,
      minPrice: Math.floor(priceAgg._min?.price || 0),
      maxPrice: Math.ceil(priceAgg._max?.price || 1000),
    };
  },
  ['shop-filter-metadata'],
  { tags: ['categories', 'brands', 'products'], revalidate: 3600 }
);

// ============================================================================
// CATEGORIES HIERARCHY TREE CACHE (Header menu)
// ============================================================================
export const getCachedCategoriesTree = unstable_cache(
  async () => {
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const withProducts = allCategories.filter(c => c._count.products > 0);
    const roots = withProducts.filter(c => !c.parentId);
    const children = withProducts.filter(c => c.parentId);

    const childrenByParent = new Map<string, typeof withProducts>();
    for (const child of children) {
      if (child.parentId) {
        if (!childrenByParent.has(child.parentId)) {
          childrenByParent.set(child.parentId, []);
        }
        childrenByParent.get(child.parentId)!.push(child);
      }
    }

    const result: Array<{ id: string; name: string; slug: string | null; parentId: string | null }> = [];

    function addChildren(parentId: string) {
      const directChildren = childrenByParent.get(parentId) || [];
      for (const ch of directChildren) {
        result.push({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          parentId: ch.parentId
        });
        addChildren(ch.id);
      }
    }

    for (const root of roots) {
      result.push({
        id: root.id,
        name: root.name,
        slug: root.slug,
        parentId: null
      });
      addChildren(root.id);
    }

    for (const ch of children) {
      if (!result.find(r => r.id === ch.id)) {
        result.push({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          parentId: ch.parentId
        });
      }
    }

    return result;
  },
  ['header-categories-with-products'],
  { tags: ['categories', 'products'], revalidate: 3600 }
);

// ============================================================================
// PRODUCT COUNTS CACHE
// ============================================================================
export const getCachedProductCounts = unstable_cache(
  async () => {
    const [newCount, hotCount, saleCount] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.count({ where: { isDeleted: false, orderItems: { some: {} } } }),
      prisma.product.count({ where: { isDeleted: false, compareAtPrice: { not: null } } }),
    ]);
    return { newCount, hotCount, saleCount };
  },
  ['layout-product-counts'],
  { tags: ['products'], revalidate: 3600 }
);

// ============================================================================
// HEATING GUIDE BLOGS CACHE (Homepage articles with minimal projection)
// ============================================================================
export const getCachedHeatingGuideBlogs = unstable_cache(
  async (limit: number = 3) => {
    return prisma.article.findMany({
      where: { isPublished: true },
      select: CARD_ARTICLE_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
  ['home-heating-guide-blogs'],
  { tags: ['articles'], revalidate: 3600 }
);

// ============================================================================
// DEFAULT SHIPPING RATE CACHE (Used on single product pages)
// ============================================================================
export const getCachedDefaultShippingRate = unstable_cache(
  async () => {
    const ptZone = await prisma.shippingZone.findFirst({
      where: { name: { in: ['PT', 'Portugal', 'DE'] }, isActive: true },
      select: {
        methods: {
          where: { isActive: true },
          orderBy: { rate: 'asc' },
          select: { rate: true },
          take: 1,
        },
      },
    });
    return ptZone?.methods?.[0]?.rate ?? 0;
  },
  ['default-shipping-rate'],
  { tags: ['shipping'], revalidate: 3600 }
);

