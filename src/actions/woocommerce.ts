'use server';

import prisma from '@/lib/prisma';
import { slugify, unescapeHtml } from '@/lib/utils';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import { getTranslations } from 'next-intl/server';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Helper to upload an image from a URL to Cloudinary
 */
async function uploadImageFromUrlToCloudinary(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const targetFolder = process.env.CLOUDINARY_FOLDER || 'ffahrrad/woocommerce-import';

    return new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: targetFolder },
        (error, result) => {
          if (error || !result) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error(`Error downloading/uploading image ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Universal helper to extract RankMath and Yoast SEO metadata from WooCommerce products/categories
 * or WordPress pages/posts (supporting meta_data array, meta object, yoast_head_json, and root fields).
 */
export function extractRankMathSEO(
  metaSource: any,
  item: {
    name?: string;
    title?: string;
    description?: string;
    short_description?: string;
    price?: string | number;
  },
  extraItemContext?: any,
  customStoreName?: string
) {
  const storeName = customStoreName || process.env.NEXT_PUBLIC_STORE_NAME || 'ffahrrad';

  let rawTitle: string | null = null;
  let rawDesc: string | null = null;
  let rawKeywords: string | null = null;
  let gtin: string | null = null;

  // 1. Array of meta (e.g. WooCommerce product / category meta_data)
  if (Array.isArray(metaSource)) {
    for (const meta of metaSource) {
      if (!meta || !meta.key) continue;
      const key = String(meta.key).trim().toLowerCase();
      const val = typeof meta.value === 'string' ? meta.value.trim() : (meta.value != null ? String(meta.value).trim() : null);
      if (!val) continue;

      // RankMath fields
      if (key === 'rank_math_title') rawTitle = val;
      if (key === 'rank_math_description') rawDesc = val;
      if (key === 'rank_math_focus_keyword') rawKeywords = val;

      // Yoast SEO fallback fields
      if (!rawTitle && (key === '_yoast_wpseo_title' || key === 'yoast_wpseo_title')) rawTitle = val;
      if (!rawDesc && (key === '_yoast_wpseo_metadesc' || key === 'yoast_wpseo_metadesc')) rawDesc = val;
      if (!rawKeywords && (key === '_yoast_wpseo_focuskw' || key === 'yoast_wpseo_focuskw')) rawKeywords = val;

      // GTIN / EAN / Barcode
      if (!gtin && (key === '_gtin' || key === 'gtin' || key === '_ean' || key === 'ean' || key === '_barcode' || key === 'barcode' || key === 'hwp_gtin' || key === 'hwp_product_gtin')) {
        gtin = val;
      }
    }
  } else if (metaSource && typeof metaSource === 'object') {
    // 2. Object of meta (e.g. WordPress REST API item.meta)
    const getVal = (k: string) => {
      const v = metaSource[k];
      return typeof v === 'string' && v.trim() ? v.trim() : (v != null ? String(v).trim() : null);
    };
    rawTitle = getVal('rank_math_title') || getVal('_yoast_wpseo_title') || getVal('yoast_wpseo_title');
    rawDesc = getVal('rank_math_description') || getVal('_yoast_wpseo_metadesc') || getVal('yoast_wpseo_metadesc');
    rawKeywords = getVal('rank_math_focus_keyword') || getVal('_yoast_wpseo_focuskw') || getVal('yoast_wpseo_focuskw');
    gtin = getVal('_gtin') || getVal('gtin') || getVal('_ean') || getVal('ean') || getVal('_barcode') || getVal('barcode');
  }

  // 3. Inspect extraItemContext or item root (e.g. Yoast head json or RankMath root properties)
  const ctx = extraItemContext || item;
  if (ctx && typeof ctx === 'object') {
    if (!rawTitle && typeof ctx.rank_math_title === 'string' && ctx.rank_math_title.trim()) {
      rawTitle = ctx.rank_math_title.trim();
    }
    if (!rawDesc && typeof ctx.rank_math_description === 'string' && ctx.rank_math_description.trim()) {
      rawDesc = ctx.rank_math_description.trim();
    }
    if (!rawKeywords && typeof ctx.rank_math_focus_keyword === 'string' && ctx.rank_math_focus_keyword.trim()) {
      rawKeywords = ctx.rank_math_focus_keyword.trim();
    }

    // Yoast head json
    if (ctx.yoast_head_json && typeof ctx.yoast_head_json === 'object') {
      if (!rawTitle) {
        rawTitle = ctx.yoast_head_json.title || ctx.yoast_head_json.og_title || null;
      }
      if (!rawDesc) {
        rawDesc = ctx.yoast_head_json.description || ctx.yoast_head_json.og_description || null;
      }
    }

    // Yoast head HTML tag fallback
    if ((!rawTitle || !rawDesc) && typeof ctx.yoast_head === 'string') {
      if (!rawTitle) {
        const titleMatch = ctx.yoast_head.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) rawTitle = titleMatch[1];
      }
      if (!rawDesc) {
        const descMatch = ctx.yoast_head.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
          || ctx.yoast_head.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
        if (descMatch && descMatch[1]) rawDesc = descMatch[1];
      }
    }
  }

  const cleanName = unescapeHtml(item.name || item.title || '').trim();
  const cleanExcerpt = (item.short_description || item.description || '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .substring(0, 160)
    .trim();

  const replaceVars = (str: string | null) => {
    if (!str) return null;
    return unescapeHtml(str)
      .replace(/%title%/gi, cleanName)
      .replace(/%%title%%/gi, cleanName)
      .replace(/%sep%/gi, '|')
      .replace(/%%sep%%/gi, '|')
      .replace(/%sitename%/gi, storeName)
      .replace(/%%sitename%%/gi, storeName)
      .replace(/%excerpt%/gi, cleanExcerpt)
      .replace(/%%excerpt%%/gi, cleanExcerpt)
      .replace(/%primary_category%/gi, '')
      .replace(/%%primary_category%%/gi, '')
      .replace(/%category%/gi, '')
      .replace(/%%category%%/gi, '')
      .replace(/%price%/gi, item.price ? `${item.price} €` : '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const finalTitle = replaceVars(rawTitle) || (cleanName ? `${cleanName} | ${storeName}` : null);
  const finalDesc = replaceVars(rawDesc) || (cleanExcerpt || null);

  return {
    metaTitle: finalTitle,
    metaDescription: finalDesc,
    metaKeywords: rawKeywords ? unescapeHtml(rawKeywords).trim() : null,
    gtin
  };
}

/**
 * Generates a unique slug
 */
async function generateUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

/**
 * Safely find or create a Category without Unique constraint collisions on name or slug
 */
async function findOrCreateCategory(rawName: string, rawSlug?: string | null) {
  const name = unescapeHtml(rawName || '').trim();
  const slug = (rawSlug && rawSlug.trim()) || slugify(name);

  // 1. Try to find by name or slug
  let category = await prisma.category.findFirst({
    where: {
      OR: [
        { name: name },
        { slug: slug }
      ]
    }
  });

  if (category) {
    return category;
  }

  // 2. If creating, ensure both name and slug are unique across the table
  let finalSlug = slug;
  let slugCounter = 1;
  while (await prisma.category.findFirst({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${slugCounter}`;
    slugCounter++;
  }

  let finalName = name;
  let nameCounter = 1;
  while (await prisma.category.findFirst({ where: { name: finalName } })) {
    finalName = `${name} (${nameCounter})`;
    nameCounter++;
  }

  return await prisma.category.create({
    data: {
      name: finalName,
      slug: finalSlug,
    }
  });
}

/**
 * Safely find or create a Brand without Unique constraint collisions on name or slug
 */
async function findOrCreateBrand(rawName: string, rawSlug?: string | null) {
  const name = unescapeHtml(rawName || '').trim();
  const slug = (rawSlug && rawSlug.trim()) || slugify(name);

  let brand = await prisma.brand.findFirst({
    where: {
      OR: [
        { name: name },
        { slug: slug }
      ]
    }
  });

  if (brand) {
    return brand;
  }

  let finalSlug = slug;
  let slugCounter = 1;
  while (await prisma.brand.findFirst({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${slugCounter}`;
    slugCounter++;
  }

  let finalName = name;
  let nameCounter = 1;
  while (await prisma.brand.findFirst({ where: { name: finalName } })) {
    finalName = `${name} (${nameCounter})`;
    nameCounter++;
  }

  return await prisma.brand.create({
    data: {
      name: finalName,
      slug: finalSlug,
    }
  });
}

/**
 * Test WooCommerce API connection
 */
export type WcProductImportItemResult = {
  id: number;
  name: string;
  status: 'SUCCESS' | 'ALREADY_EXISTS' | 'FAILED';
  error?: string;
  image?: string | null;
  price?: string | number;
};

export interface ProcessWcProductsResult {
  importedCount: number;
  alreadyExistsCount: number;
  failedCount: number;
  items: WcProductImportItemResult[];
}

export async function testWooCommerceConnection(url: string, consumerKey: string, consumerSecret: string) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/system_status`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return { success: false, message: `Connexion refusée : ${response.status} ${response.statusText}` };
    }

    return { success: true, message: 'Connexion réussie à l\'API WooCommerce !' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Impossible de joindre le serveur WooCommerce.' };
  }
}

/**
 * Fetch remote categories list with product count
 */
export async function fetchWooCommerceCategoriesList(url: string, consumerKey: string, consumerSecret: string) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products/categories`;

  try {
    let allCategories: Array<{ id: number; name: string; count: number; slug: string }> = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const response = await fetch(`${apiUrl}?per_page=100&page=${page}&hide_empty=false`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
      }

      const cats = await response.json();
      if (!Array.isArray(cats) || cats.length === 0) {
        hasMore = false;
      } else {
        cats.forEach((c: any) => {
          allCategories.push({
            id: c.id,
            name: unescapeHtml(c.name),
            count: c.count || 0,
            slug: c.slug
          });
        });
        page++;
      }
    }

    return { success: true, categories: allCategories };
  } catch (error: any) {
    console.error('Error fetching categories list:', error);
    return { success: false, message: error.message || 'Erreur lors de la récupération des catégories.' };
  }
}

/**
 * Fetch remote products list for individual selection (supports search & pagination)
 */
export async function fetchWooCommerceProductsList(
  url: string,
  consumerKey: string,
  consumerSecret: string,
  search: string = '',
  page: number = 1,
  categoryFilter?: number
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  let apiUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=20&page=${page}`;

  if (search) {
    apiUrl += `&search=${encodeURIComponent(search)}`;
  }
  if (categoryFilter) {
    apiUrl += `&category=${categoryFilter}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
    }

    const total = parseInt(response.headers.get('x-wp-total') || '0', 10);
    const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1', 10);

    const prods = await response.json();
    if (!Array.isArray(prods)) {
      return { success: true, products: [], total: 0, totalPages: 0 };
    }

    // Check which ones are already in local DB (comparing both decoded and raw titles)
    const rawTitles = prods.map(p => p.name);
    const decodedTitles = prods.map(p => unescapeHtml(p.name));
    const allTitlesToCheck = Array.from(new Set([...rawTitles, ...decodedTitles]));

    const existing = await prisma.product.findMany({
      where: { title: { in: allTitlesToCheck } },
      select: { title: true }
    });
    const existingTitles = new Set(existing.map(e => e.title));

    const products = prods.map((p: any) => {
      const decodedName = unescapeHtml(p.name);
      return {
        id: p.id,
        name: decodedName,
        price: p.price || p.regular_price || '0',
        image: (p.images && p.images[0]?.src) ? p.images[0].src : null,
        categories: (p.categories || []).map((c: any) => unescapeHtml(c.name)),
        alreadyImported: existingTitles.has(decodedName) || existingTitles.has(p.name)
      };
    });

    return { success: true, products, total, totalPages };
  } catch (error: any) {
    console.error('Error fetching products list:', error);
    return { success: false, message: error.message || 'Erreur lors de la récupération des produits.' };
  }
}

/**
 * Import categories from WooCommerce to create/update local category tree.
 * If categoryIds is provided, only those categories (and their parent hierarchy) are imported.
 */
export async function importWooCommerceCategories(
  url: string,
  consumerKey: string,
  consumerSecret: string,
  categoryIds?: number[]
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products/categories`;

  try {
    let allCategories: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 20) {
      const response = await fetch(`${apiUrl}?per_page=100&page=${page}`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erreur API WooCommerce (Catégories): ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text().catch(() => 'Impossible de lire le corps de la réponse');
        console.error(`WooCommerce API HTML response: ${text.substring(0, 500)}...`);
        const t = await getTranslations('AdminCategories');
        throw new Error(t('woo_import_cat_html_error') + ` (Content-Type: ${contentType})`);
      }

      const cats = await response.json();
      if (cats.length === 0) {
        hasMore = false;
      } else {
        allCategories = [...allCategories, ...cats];
        page++;
      }
    }

    if (allCategories.length === 0) return { success: true, count: 0 };

    // If specific categoryIds were requested, filter down to only those categories and their ancestor hierarchy
    let categoriesToImport = allCategories;
    if (categoryIds && categoryIds.length > 0) {
      const selectedIdSet = new Set<number>(categoryIds);
      const catById = new Map<number, any>(allCategories.map(c => [c.id, c]));
      const neededIds = new Set<number>();

      // Traverse each selected category and include all its parents
      for (const id of categoryIds) {
        let curr = catById.get(id);
        while (curr) {
          neededIds.add(curr.id);
          if (curr.parent && curr.parent > 0) {
            curr = catById.get(curr.parent);
          } else {
            break;
          }
        }
      }

      categoriesToImport = allCategories.filter(c => neededIds.has(c.id));
    }

    if (categoriesToImport.length === 0) return { success: true, count: 0 };

    // 1st Pass: Create all filtered categories to get their UUIDs
    const wcIdToUuidMap: Record<number, string> = {};

    for (const wcCat of categoriesToImport) {
      const category = await findOrCreateCategory(wcCat.name, wcCat.slug);
      wcIdToUuidMap[wcCat.id] = category.id;

      // Extract and update SEO metadata from RankMath / Yoast
      const catSeo = extractRankMathSEO(wcCat.meta_data, wcCat);
      if (catSeo.metaTitle || catSeo.metaDescription || catSeo.metaKeywords) {
        await prisma.category.update({
          where: { id: category.id },
          data: {
            ...(catSeo.metaTitle ? { metaTitle: catSeo.metaTitle } : {}),
            ...(catSeo.metaDescription ? { metaDescription: catSeo.metaDescription } : {}),
            ...(catSeo.metaKeywords ? { metaKeywords: catSeo.metaKeywords } : {}),
          }
        });
      }
    }

    // 2nd Pass: Link parents
    for (const wcCat of categoriesToImport) {
      if (wcCat.parent && wcCat.parent > 0) {
        const parentUuid = wcIdToUuidMap[wcCat.parent];
        const childUuid = wcIdToUuidMap[wcCat.id];

        if (parentUuid && childUuid) {
          await prisma.category.update({
            where: { id: childUuid },
            data: { parentId: parentUuid }
          });
        }
      }
    }

    revalidatePath('/admin/categories');
    return { success: true, count: categoriesToImport.length };

  } catch (error: any) {
    console.error('Error importing categories from WooCommerce:', error);
    return { success: false, message: error.message || 'Une erreur est survenue lors de l\'importation des catégories.' };
  }
}

/**
 * Gets the total number of products to import (optionally filtered by categories)
 */
export async function countWooCommerceProducts(
  url: string,
  consumerKey: string,
  consumerSecret: string,
  categoryIds?: number[]
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  let apiUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=1`;

  if (categoryIds && categoryIds.length > 0) {
    apiUrl += `&category=${categoryIds.join(',')}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
    }

    const totalStr = response.headers.get('x-wp-total');
    if (!totalStr) {
      return { success: false, message: "Impossible de déterminer le nombre total de produits (header x-wp-total manquant)." };
    }

    const total = parseInt(totalStr, 10);
    return { success: true, total };
  } catch (error: any) {
    console.error('Error counting WooCommerce products:', error);
    return { success: false, message: error.message || 'Une erreur inattendue est survenue.' };
  }
}

/**
 * Helper to process and import an array of WooCommerce product objects into Prisma
 */
async function processAndSaveWcProducts(
  products: any[],
  apiUrl: string,
  consumerKey: string,
  consumerSecret: string,
  allowedCategoryIds?: number[]
): Promise<ProcessWcProductsResult> {
  let importedCount = 0;
  let alreadyExistsCount = 0;
  let failedCount = 0;
  const items: WcProductImportItemResult[] = [];

  const allowedSet = (allowedCategoryIds && allowedCategoryIds.length > 0) ? new Set(allowedCategoryIds) : null;

  for (const wcProduct of products) {
    const decodedTitle = unescapeHtml(wcProduct.name || '');
    const rawTitle = wcProduct.name || '';
    const imgUrl = (wcProduct.images && wcProduct.images[0]?.src) ? wcProduct.images[0].src : null;
    const priceVal = wcProduct.price || wcProduct.regular_price || '0';

    try {
      // 1. Extract SEO metadata from RankMath / Yoast
      const seo = extractRankMathSEO(wcProduct.meta_data, wcProduct);

      // Check if product with same title or slug already exists on destination site
      const baseSlug = wcProduct.slug || slugify(decodedTitle);
      const existingProduct = await prisma.product.findFirst({
        where: {
          OR: [
            { title: decodedTitle },
            { title: rawTitle },
            { slug: baseSlug }
          ]
        },
        select: { id: true, title: true }
      });

      if (existingProduct) {
        // Synchronize SEO & GTIN metadata on existing product
        if (seo.metaTitle || seo.metaDescription || seo.gtin) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              ...(seo.metaTitle ? { metaTitle: seo.metaTitle } : {}),
              ...(seo.metaDescription ? { metaDescription: seo.metaDescription } : {}),
              ...(seo.gtin ? { gtin: seo.gtin } : {}),
            }
          });
        }

        items.push({
          id: wcProduct.id,
          name: decodedTitle,
          status: 'ALREADY_EXISTS',
          image: imgUrl,
          price: priceVal
        });
        alreadyExistsCount++;
        continue; // Skip creating duplicate product
      }

      // 2. Process Categories
      const categoryIds: string[] = [];
      if (wcProduct.categories && Array.isArray(wcProduct.categories)) {
        for (const wcCat of wcProduct.categories) {
          if (allowedSet && !allowedSet.has(wcCat.id)) {
            continue;
          }

          const category = await findOrCreateCategory(wcCat.name, wcCat.slug);
          categoryIds.push(category.id);
        }
      }

      // 3. Process Brands
      let brandId: string | null = null;
      let brandName: string | null = null;
      let brandSlug: string | null = null;

      if (wcProduct.brands && Array.isArray(wcProduct.brands) && wcProduct.brands.length > 0) {
        brandName = wcProduct.brands[0].name;
        brandSlug = wcProduct.brands[0].slug;
      } else if (wcProduct.attributes && Array.isArray(wcProduct.attributes)) {
        const brandAttr = wcProduct.attributes.find((a: any) =>
          a.name.toLowerCase() === 'brand' ||
          a.name.toLowerCase() === 'marque' ||
          a.name.toLowerCase() === 'brands' ||
          a.name.toLowerCase() === 'marques'
        );
        if (brandAttr && brandAttr.options && brandAttr.options.length > 0) {
          brandName = brandAttr.options[0];
          brandSlug = brandName ? brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null;
        }
      }

      if (brandName) {
        const brand = await findOrCreateBrand(brandName, brandSlug);
        brandId = brand.id;
      }

      // 4. Process Images
      const cloudinaryImageUrls: string[] = [];
      if (wcProduct.images && Array.isArray(wcProduct.images)) {
        const uploadPromises = wcProduct.images.map(async (wcImg: any) => {
          if (!wcImg.src) return null;
          try {
            const secureUrl = await uploadImageFromUrlToCloudinary(wcImg.src);
            if (secureUrl) {
              const rawImgName = wcImg.name || wcImg.title;
              const imgTitle = (rawImgName && typeof rawImgName === 'string' && rawImgName.trim())
                ? unescapeHtml(rawImgName).trim()
                : decodedTitle;
              const imgAlt = (wcImg.alt && typeof wcImg.alt === 'string' && wcImg.alt.trim())
                ? unescapeHtml(wcImg.alt).trim()
                : imgTitle;
              await prisma.media.upsert({
                where: { url: secureUrl },
                update: {
                  title: imgTitle,
                  altText: imgAlt,
                },
                create: {
                  url: secureUrl,
                  title: imgTitle,
                  altText: imgAlt,
                }
              });
              return secureUrl;
            }
          } catch (uploadErr) {
            console.warn(`[WooCommerce Import] Image upload failed for ${wcImg.src}:`, uploadErr);
          }
          return null;
        });

        const results = await Promise.all(uploadPromises);
        results.forEach((url) => {
          if (url) cloudinaryImageUrls.push(url as string);
        });
      }

      const uniqueSlug = await generateUniqueSlug(baseSlug);
      const price = parseFloat(wcProduct.price || wcProduct.regular_price || '0');
      const compareAtPrice = parseFloat(wcProduct.regular_price || '0');

      let stock: number | null = null;
      if (wcProduct.manage_stock && wcProduct.stock_quantity !== null) {
        stock = parseInt(wcProduct.stock_quantity, 10);
      }

      // 5. Tags
      const tags: string[] = [];
      if (wcProduct.tags && Array.isArray(wcProduct.tags)) {
        wcProduct.tags.forEach((t: any) => {
          if (t && t.name) tags.push(t.name);
        });
      }

      // 6. Attributes
      let parsedAttributes: any[] = [];
      if (wcProduct.attributes && Array.isArray(wcProduct.attributes)) {
        parsedAttributes = wcProduct.attributes
          .filter((attr: any) => attr.variation)
          .map((attr: any) => ({
            name: attr.name,
            options: attr.options
          }));
      }

      // 7. Variations
      let parsedVariations: any[] = [];
      if (wcProduct.type === 'variable') {
        try {
          const varResponse = await fetch(`${apiUrl}/${wcProduct.id}/variations`, {
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });
          if (varResponse.ok) {
            const wcVariations = await varResponse.json();
            if (Array.isArray(wcVariations)) {
              parsedVariations = await Promise.all(wcVariations.map(async (wcVar: any) => {
                const attrMap: Record<string, string> = {};
                if (wcVar.attributes && Array.isArray(wcVar.attributes)) {
                  wcVar.attributes.forEach((a: any) => {
                    attrMap[a.name] = a.option;
                  });
                }

                let varImage = undefined;
                if (wcVar.image && wcVar.image.src) {
                  try {
                    const secureUrl = await uploadImageFromUrlToCloudinary(wcVar.image.src);
                    if (secureUrl) {
                      varImage = secureUrl;
                      const varOptions = Object.values(attrMap).filter(Boolean).join(', ');
                      const defaultVarTitle = `${decodedTitle}${varOptions ? ` (${varOptions})` : ''}`;
                      const rawVarImgName = wcVar.image.name || wcVar.image.title;
                      const varTitle = (rawVarImgName && typeof rawVarImgName === 'string' && rawVarImgName.trim())
                        ? unescapeHtml(rawVarImgName).trim()
                        : defaultVarTitle;
                      const varAlt = (wcVar.image.alt && typeof wcVar.image.alt === 'string' && wcVar.image.alt.trim())
                        ? unescapeHtml(wcVar.image.alt).trim()
                        : varTitle;
                      await prisma.media.upsert({
                        where: { url: secureUrl },
                        update: {
                          title: varTitle,
                          altText: varAlt,
                        },
                        create: {
                          url: secureUrl,
                          title: varTitle,
                          altText: varAlt,
                        }
                      });
                    }
                  } catch (e) {
                    console.warn(`[WooCommerce Import] Variation image upload failed for var ${wcVar.id}:`, e);
                  }
                }

                return {
                  id: String(wcVar.id),
                  attributes: attrMap,
                  price: parseFloat(wcVar.price || wcVar.regular_price || '0'),
                  stock: (wcVar.manage_stock && wcVar.stock_quantity !== null) ? parseInt(wcVar.stock_quantity, 10) : null,
                  image: varImage
                };
              }));
            }
          }
        } catch (err) {
          console.error(`Failed to fetch variations for product ${wcProduct.id}`, err);
        }
      }

      // 8. Create Product in Prisma
      const createdProduct = await prisma.product.create({
        data: {
          title: decodedTitle,
          slug: uniqueSlug,
          description: wcProduct.description || '',
          shortDescription: wcProduct.short_description || '',
          price: price,
          compareAtPrice: (compareAtPrice > price) ? compareAtPrice : null,
          images: cloudinaryImageUrls,
          stock: stock,
          type: wcProduct.type === 'variable' ? 'VARIABLE' : 'SIMPLE',
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          gtin: seo.gtin,
          tags: {
            connectOrCreate: tags.map((t: string) => ({
              where: { name: t },
              create: { name: t, slug: slugify(t) }
            }))
          },
          brandId: brandId,
          attributes: parsedAttributes.length > 0 ? parsedAttributes : undefined,
          variations: parsedVariations.length > 0 ? parsedVariations : undefined,
          categories: {
            connect: categoryIds.map(id => ({ id }))
          }
        }
      });

      // 9. Import reviews
      try {
        const reviewsResponse = await fetch(`${apiUrl}/reviews?product=${wcProduct.id}`, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });

        if (reviewsResponse.ok) {
          const wcReviews = await reviewsResponse.json();
          if (Array.isArray(wcReviews) && wcReviews.length > 0) {
            const reviewsToInsert = wcReviews
              .filter(r => r.status === 'approved')
              .map(r => ({
                productId: createdProduct.id,
                reviewerName: r.reviewer || null,
                reviewerEmail: r.reviewer_email || null,
                rating: r.rating || 5,
                comment: r.review ? r.review.replace(/(<([^>]+)>)/gi, "") : '',
                isApproved: true,
                createdAt: new Date(r.date_created)
              }));

            if (reviewsToInsert.length > 0) {
              await prisma.review.createMany({
                data: reviewsToInsert
              });
            }
          }
        }
      } catch (err) {
        console.error(`Failed to fetch reviews for product ${wcProduct.id}`, err);
      }

      items.push({
        id: wcProduct.id,
        name: decodedTitle,
        status: 'SUCCESS',
        image: cloudinaryImageUrls[0] || imgUrl,
        price: price
      });
      importedCount++;

    } catch (productError: any) {
      console.error(`Error importing product ${wcProduct.id} (${decodedTitle}):`, productError);
      items.push({
        id: wcProduct.id,
        name: decodedTitle,
        status: 'FAILED',
        error: productError?.message || 'Erreur inattendue lors de l\'enregistrement',
        image: imgUrl,
        price: priceVal
      });
      failedCount++;
    }
  }

  return {
    importedCount,
    alreadyExistsCount,
    failedCount,
    items
  };
}

export async function importWooCommerceProductsBatch(
  url: string,
  consumerKey: string,
  consumerSecret: string,
  page: number = 1,
  perPage: number = 5,
  categoryIds?: number[]
) {
  await requireAdmin();

  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products`;

  try {
    let queryUrl = `${apiUrl}?per_page=${perPage}&page=${page}`;
    if (categoryIds && categoryIds.length > 0) {
      queryUrl += `&category=${categoryIds.join(',')}`;
    }

    const response = await fetch(queryUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text().catch(() => 'Impossible de lire le corps de la réponse');
      console.error(`WooCommerce API HTML response (products): ${text.substring(0, 200)}...`);
      const t = await getTranslations('AdminProducts');
      throw new Error(t('woo_import_prod_html_error') + ` (Content-Type: ${contentType})`);
    }

    let products;
    try {
      products = await response.json();
    } catch (err) {
      const t = await getTranslations('AdminProducts');
      throw new Error(t('woo_import_parse_error'));
    }

    if (!Array.isArray(products) || products.length === 0) {
      return { success: true, count: 0, successCount: 0, alreadyExistsCount: 0, failedCount: 0, results: [] };
    }

    const batchResult = await processAndSaveWcProducts(products, apiUrl, consumerKey, consumerSecret, categoryIds);

    revalidatePath('/admin/products');
    revalidatePath('/');

    const { updateTag } = await import('next/cache');
    updateTag('products');
    updateTag('categories');

    return {
      success: true,
      count: batchResult.importedCount,
      successCount: batchResult.importedCount,
      alreadyExistsCount: batchResult.alreadyExistsCount,
      failedCount: batchResult.failedCount,
      results: batchResult.items
    };

  } catch (error: any) {
    console.error('Error importing batch from WooCommerce:', error);
    return { success: false, message: error.message || 'Une erreur inattendue est survenue.' };
  }
}

/**
 * Import specific product IDs directly
 */
export async function importWooCommerceSelectedProducts(
  url: string,
  consumerKey: string,
  consumerSecret: string,
  productIds: number[]
) {
  await requireAdmin();

  if (!productIds || productIds.length === 0) {
    return { success: true, count: 0, successCount: 0, alreadyExistsCount: 0, failedCount: 0, results: [] };
  }

  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products`;

  try {
    let totalImported = 0;
    let totalAlreadyExists = 0;
    let totalFailed = 0;
    const allResults: WcProductImportItemResult[] = [];

    // Chunk requests by 5 to respect Cloudinary & network timeout limits
    const chunkSize = 5;
    for (let i = 0; i < productIds.length; i += chunkSize) {
      const slice = productIds.slice(i, i + chunkSize);
      const queryUrl = `${apiUrl}?include=${slice.join(',')}&per_page=${chunkSize}`;

      const response = await fetch(queryUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erreur API WooCommerce: ${response.status} ${response.statusText}`);
      }

      const products = await response.json();
      if (Array.isArray(products) && products.length > 0) {
        const batchResult = await processAndSaveWcProducts(products, apiUrl, consumerKey, consumerSecret);
        totalImported += batchResult.importedCount;
        totalAlreadyExists += batchResult.alreadyExistsCount;
        totalFailed += batchResult.failedCount;
        allResults.push(...batchResult.items);
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/');

    const { updateTag } = await import('next/cache');
    updateTag('products');
    updateTag('categories');

    return {
      success: true,
      count: totalImported,
      successCount: totalImported,
      alreadyExistsCount: totalAlreadyExists,
      failedCount: totalFailed,
      results: allResults
    };
  } catch (error: any) {
    console.error('Error importing specific products:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'import des produits sélectionnés.' };
  }
}

/**
 * Import WooCommerce Orders
 */
export async function importWooCommerceOrders(
  url: string,
  consumerKey: string,
  consumerSecret: string
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wc/v3/orders`;

  try {
    let totalImported = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 50) {
      const response = await fetch(`${apiUrl}?per_page=50&page=${page}`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erreur API WooCommerce Orders: ${response.status} ${response.statusText}`);
      }

      const orders = await response.json();
      if (!Array.isArray(orders) || orders.length === 0) {
        hasMore = false;
        break;
      }

      for (const wcOrder of orders) {
        const customerEmail = wcOrder.billing?.email || `customer-${wcOrder.customer_id || wcOrder.id}@lenhaecarvaosilvadias.com`;

        let user = await prisma.user.findUnique({
          where: { email: customerEmail }
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: customerEmail,
              role: 'CUSTOMER',
              createdAt: new Date(wcOrder.date_created_gmt || wcOrder.date_created || Date.now())
            }
          });
        }

        let status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' = 'PENDING';
        switch (wcOrder.status) {
          case 'completed':
            status = 'DELIVERED';
            break;
          case 'processing':
            status = 'PROCESSING';
            break;
          case 'on-hold':
          case 'pending':
            status = 'PENDING';
            break;
          case 'cancelled':
          case 'refunded':
          case 'failed':
            status = 'CANCELLED';
            break;
          default:
            status = 'PROCESSING';
        }

        let paymentMethod: 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' = 'STRIPE';
        if (wcOrder.payment_method === 'bacs' || wcOrder.payment_method === 'bank_transfer') {
          paymentMethod = 'BANK_TRANSFER';
        } else if (wcOrder.payment_method === 'paypal') {
          paymentMethod = 'PAYPAL';
        }

        const orderRef = `WC-${wcOrder.id}`;
        const existingOrder = await prisma.order.findUnique({
          where: { trackingNumber: orderRef }
        });

        if (existingOrder) {
          continue;
        }

        const destinationAddress = [
          wcOrder.shipping?.address_1 || wcOrder.billing?.address_1,
          wcOrder.shipping?.postcode || wcOrder.billing?.postcode,
          wcOrder.shipping?.city || wcOrder.billing?.city,
          wcOrder.shipping?.country || wcOrder.billing?.country
        ].filter(Boolean).join(', ');

        const createdOrder = await prisma.order.create({
          data: {
            userId: user.id,
            status,
            paymentMethod,
            total: parseFloat(wcOrder.total) || 0,
            trackingNumber: orderRef,
            destinationAddress: destinationAddress || null,
            destinationCountry: wcOrder.shipping?.country || wcOrder.billing?.country || 'PT',
            createdAt: new Date(wcOrder.date_created_gmt || wcOrder.date_created || Date.now()),
            updatedAt: new Date(wcOrder.date_modified_gmt || wcOrder.date_modified || Date.now())
          }
        });

        if (wcOrder.line_items && Array.isArray(wcOrder.line_items)) {
          for (const item of wcOrder.line_items) {
            const cleanItemName = unescapeHtml(item.name || '').trim();
            const baseItemName = cleanItemName.split(',')[0].trim();
            const itemSlug = slugify(cleanItemName);
            const baseSlug = slugify(baseItemName);

            // Robust multi-step product lookup to avoid phantom duplicates
            let product = await prisma.product.findFirst({
              where: {
                isDeleted: false,
                OR: [
                  { title: cleanItemName },
                  { title: item.name },
                  { slug: itemSlug },
                  ...(baseSlug ? [{ slug: baseSlug }, { slug: { startsWith: `${baseSlug}-` } }] : []),
                  ...(baseItemName.length > 5 ? [{ title: { contains: baseItemName, mode: 'insensitive' as const } }] : [])
                ]
              }
            });

            if (!product) {
              product = await prisma.product.create({
                data: {
                  title: cleanItemName,
                  slug: `${itemSlug}-${item.id}`,
                  price: parseFloat(item.price) || 0,
                  stock: 0,
                  description: item.name,
                  isDeleted: true,
                  deletedAt: new Date()
                }
              });
            }

            await prisma.orderItem.create({
              data: {
                orderId: createdOrder.id,
                productId: product.id,
                quantity: item.quantity || 1,
                price: parseFloat(item.price) || 0,
                attributes: item.meta_data ? item.meta_data : undefined
              }
            });
          }
        }

        totalImported++;
      }

      page++;
    }

    revalidatePath('/admin/orders');
    return { success: true, count: totalImported };
  } catch (error: any) {
    console.error('Error importing WooCommerce orders:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'import des commandes.' };
  }
}

/**
 * Import WordPress Pages (with SEO & Featured Media + Alt/Title)
 */
export async function importWordPressPages(
  url: string,
  consumerKey: string,
  consumerSecret: string
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wp/v2/pages?_embed=true`;

  try {
    let totalImported = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const response = await fetch(`${apiUrl}&per_page=100&page=${page}`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erreur API WordPress Pages: ${response.status} ${response.statusText}`);
      }

      const pages = await response.json();
      if (!Array.isArray(pages) || pages.length === 0) {
        hasMore = false;
        break;
      }

      for (const wpPage of pages) {
        const title = unescapeHtml(wpPage.title?.rendered || '').trim();
        const slug = wpPage.slug || slugify(title);
        const content = wpPage.content?.rendered || '';
        const excerpt = unescapeHtml(wpPage.excerpt?.rendered || '').replace(/<[^>]*>?/gm, '').trim();

        // 1. Process featured image if present & store in Media table with title/alt
        const featMedia = wpPage._embedded?.['wp:featuredmedia']?.[0];
        const mediaSource = featMedia?.source_url || featMedia?.media_details?.sizes?.full?.source_url;
        if (mediaSource) {
          try {
            const secureUrl = await uploadImageFromUrlToCloudinary(mediaSource);
            if (secureUrl) {
              const rawMediaTitle = featMedia.title?.rendered || featMedia.slug;
              const mediaTitle = (rawMediaTitle && typeof rawMediaTitle === 'string' && rawMediaTitle.trim())
                ? unescapeHtml(rawMediaTitle).trim()
                : title;
              const rawAlt = featMedia.alt_text || featMedia.caption?.rendered;
              const mediaAlt = (rawAlt && typeof rawAlt === 'string' && rawAlt.trim())
                ? unescapeHtml(rawAlt).trim()
                : mediaTitle;
              const mediaCaption = unescapeHtml(featMedia.caption?.rendered || '').replace(/<[^>]*>?/gm, '').trim();
              const mediaDesc = unescapeHtml(featMedia.description?.rendered || '').replace(/<[^>]*>?/gm, '').trim();

              await prisma.media.upsert({
                where: { url: secureUrl },
                update: {
                  title: mediaTitle,
                  altText: mediaAlt,
                  legend: mediaCaption || undefined,
                  description: mediaDesc || undefined
                },
                create: {
                  url: secureUrl,
                  title: mediaTitle,
                  altText: mediaAlt,
                  legend: mediaCaption || undefined,
                  description: mediaDesc || undefined
                }
              });
            }
          } catch (mediaErr) {
            console.warn(`[WordPress Page Import] Could not upload featured image:`, mediaErr);
          }
        }

        // 2. Extract RankMath & Yoast SEO
        const seo = extractRankMathSEO(
          wpPage.meta_data || wpPage.meta,
          { title, description: content, short_description: excerpt },
          wpPage
        );

        await prisma.page.upsert({
          where: { slug },
          update: {
            title,
            desktopContent: content,
            mobileContent: content,
            isPublished: wpPage.status === 'publish',
            metaTitle: seo.metaTitle || title,
            metaDescription: seo.metaDescription || excerpt.slice(0, 160) || null,
            metaKeywords: seo.metaKeywords || null
          },
          create: {
            title,
            slug,
            desktopContent: content,
            mobileContent: content,
            isPublished: wpPage.status === 'publish',
            metaTitle: seo.metaTitle || title,
            metaDescription: seo.metaDescription || excerpt.slice(0, 160) || null,
            metaKeywords: seo.metaKeywords || null
          }
        });
        totalImported++;
      }
      page++;
    }

    revalidatePath('/admin/pages');
    return { success: true, count: totalImported };
  } catch (error: any) {
    console.error('Error importing WordPress pages:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'import des pages.' };
  }
}

/**
 * Import WordPress Posts / Blog Articles (with Authors, Categories, Tags, SEO & Media with Titles)
 */
export async function importWordPressArticles(
  url: string,
  consumerKey: string,
  consumerSecret: string
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wp/v2/posts?_embed=true`;

  try {
    let totalImported = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const response = await fetch(`${apiUrl}&per_page=100&page=${page}`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Erreur API WordPress Posts: ${response.status} ${response.statusText}`);
      }

      const posts = await response.json();
      if (!Array.isArray(posts) || posts.length === 0) {
        hasMore = false;
        break;
      }

      for (const wpPost of posts) {
        const title = unescapeHtml(wpPost.title?.rendered || '').trim();
        const slug = wpPost.slug || slugify(title);
        const content = wpPost.content?.rendered || '';
        const excerpt = unescapeHtml(wpPost.excerpt?.rendered || '').replace(/<[^>]*>?/gm, '').trim();

        // 1. Process featured image & save in prisma.media with its title and altText
        let imageUrl: string | null = null;
        const featMedia = wpPost._embedded?.['wp:featuredmedia']?.[0];
        const mediaSource = featMedia?.source_url || featMedia?.media_details?.sizes?.full?.source_url;
        if (mediaSource) {
          try {
            imageUrl = await uploadImageFromUrlToCloudinary(mediaSource);
            if (imageUrl) {
              const rawMediaTitle = featMedia.title?.rendered || featMedia.slug;
              const mediaTitle = (rawMediaTitle && typeof rawMediaTitle === 'string' && rawMediaTitle.trim())
                ? unescapeHtml(rawMediaTitle).trim()
                : title;
              const rawAlt = featMedia.alt_text || featMedia.caption?.rendered;
              const mediaAlt = (rawAlt && typeof rawAlt === 'string' && rawAlt.trim())
                ? unescapeHtml(rawAlt).trim()
                : mediaTitle;
              const mediaCaption = unescapeHtml(featMedia.caption?.rendered || '').replace(/<[^>]*>?/gm, '').trim();
              const mediaDesc = unescapeHtml(featMedia.description?.rendered || '').replace(/<[^>]*>?/gm, '').trim();

              await prisma.media.upsert({
                where: { url: imageUrl },
                update: {
                  title: mediaTitle,
                  altText: mediaAlt,
                  legend: mediaCaption || undefined,
                  description: mediaDesc || undefined
                },
                create: {
                  url: imageUrl,
                  title: mediaTitle,
                  altText: mediaAlt,
                  legend: mediaCaption || undefined,
                  description: mediaDesc || undefined
                }
              });
            }
          } catch (mediaErr) {
            console.warn(`[WordPress Post Import] Could not upload featured image:`, mediaErr);
          }
        }

        // 2. Extract Author
        const authorName = wpPost._embedded?.author?.[0]?.name 
          ? unescapeHtml(wpPost._embedded.author[0].name).trim() 
          : null;

        // 3. Extract Category & Tags
        let categoryName: string | null = null;
        const tagsList: string[] = [];
        if (wpPost._embedded?.['wp:term'] && Array.isArray(wpPost._embedded['wp:term'])) {
          const termsCat = wpPost._embedded['wp:term'][0];
          if (Array.isArray(termsCat) && termsCat.length > 0) {
            categoryName = unescapeHtml(termsCat[0].name || '').trim() || null;
          }
          const termsTags = wpPost._embedded['wp:term'][1];
          if (Array.isArray(termsTags)) {
            termsTags.forEach((t: any) => {
              if (t?.name) tagsList.push(unescapeHtml(t.name).trim());
            });
          }
        }

        // 4. Extract RankMath & Yoast SEO
        const seo = extractRankMathSEO(
          wpPost.meta_data || wpPost.meta,
          { title, description: content, short_description: excerpt },
          wpPost
        );

        const postCreatedAt = new Date(wpPost.date_gmt || wpPost.date || Date.now());
        const postUpdatedAt = new Date(wpPost.modified_gmt || wpPost.modified || Date.now());

        await prisma.article.upsert({
          where: { slug },
          update: {
            title,
            content,
            excerpt,
            image: imageUrl,
            category: categoryName,
            authorName,
            tags: tagsList,
            isPublished: wpPost.status === 'publish',
            metaTitle: seo.metaTitle || title,
            metaDescription: seo.metaDescription || excerpt.slice(0, 160) || null,
            metaKeywords: seo.metaKeywords || null,
            updatedAt: postUpdatedAt
          },
          create: {
            title,
            slug,
            content,
            excerpt,
            image: imageUrl,
            category: categoryName,
            authorName,
            tags: tagsList,
            isPublished: wpPost.status === 'publish',
            metaTitle: seo.metaTitle || title,
            metaDescription: seo.metaDescription || excerpt.slice(0, 160) || null,
            metaKeywords: seo.metaKeywords || null,
            createdAt: postCreatedAt,
            updatedAt: postUpdatedAt
          }
        });
        totalImported++;
      }
      page++;
    }

    revalidatePath('/admin/blogs');
    revalidatePath('/blog');
    return { success: true, count: totalImported };
  } catch (error: any) {
    console.error('Error importing WordPress articles:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'import des articles.' };
  }
}

/**
 * Import WordPress Media Library items directly into Prisma Media with their titles, alt text, captions & descriptions
 */
export async function importWordPressMedia(
  url: string,
  consumerKey: string,
  consumerSecret: string
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/wp-json/wp/v2/media`;

  try {
    let totalImported = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const response = await fetch(`${apiUrl}?per_page=100&page=${page}`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          console.warn(`[WordPress Media] Endpoint returned ${response.status}`);
          break;
        }
        throw new Error(`Erreur API WordPress Media: ${response.status} ${response.statusText}`);
      }

      const mediaItems = await response.json();
      if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
        hasMore = false;
        break;
      }

      for (const item of mediaItems) {
        const sourceUrl = item.source_url || item.guid?.rendered;
        if (!sourceUrl) continue;

        const rawTitle = unescapeHtml(item.title?.rendered || item.slug || '').trim();
        const rawAlt = unescapeHtml(item.alt_text || '').trim() || rawTitle;
        const rawCaption = unescapeHtml(item.caption?.rendered || '').replace(/<[^>]*>?/gm, '').trim();
        const rawDescription = unescapeHtml(item.description?.rendered || '').replace(/<[^>]*>?/gm, '').trim();

        // Check if already in DB
        const existingMedia = await prisma.media.findUnique({
          where: { url: sourceUrl }
        });

        if (existingMedia) {
          await prisma.media.update({
            where: { id: existingMedia.id },
            data: {
              title: rawTitle || existingMedia.title,
              altText: rawAlt || existingMedia.altText,
              legend: rawCaption || existingMedia.legend,
              description: rawDescription || existingMedia.description,
            }
          });
          totalImported++;
          continue;
        }

        // Upload to Cloudinary to preserve asset locally
        const secureUrl = await uploadImageFromUrlToCloudinary(sourceUrl);
        const finalUrl = secureUrl || sourceUrl;

        await prisma.media.upsert({
          where: { url: finalUrl },
          update: {
            title: rawTitle,
            altText: rawAlt,
            legend: rawCaption || undefined,
            description: rawDescription || undefined,
          },
          create: {
            url: finalUrl,
            title: rawTitle,
            altText: rawAlt,
            legend: rawCaption || undefined,
            description: rawDescription || undefined,
          }
        });

        totalImported++;
      }

      page++;
    }

    revalidatePath('/admin/media');
    return { success: true, count: totalImported };
  } catch (error: any) {
    console.error('Error importing WordPress media:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'import des médias.' };
  }
}

/**
 * Import WooCommerce Shipping Zones, Served Locations & Shipping Methods
 */
export async function importWooCommerceShipping(
  url: string,
  consumerKey: string,
  consumerSecret: string
) {
  await requireAdmin();
  const baseUrl = url.replace(/\/$/, '');
  const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const zonesUrl = `${baseUrl}/wp-json/wc/v3/shipping/zones`;
    const response = await fetch(zonesUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Erreur API WooCommerce Shipping Zones: ${response.status} ${response.statusText}`);
    }

    const zones = await response.json();
    let importedZonesCount = 0;
    let importedMethodsCount = 0;
    const importedSummary: any[] = [];

    // Array of all zone objects to process, including zone 0 (Rest of the World)
    const zonesToProcess = Array.isArray(zones) ? [...zones] : [];
    zonesToProcess.push({ id: 0, name: 'Outras Zonas (Resto do Mundo)' });

    for (const wcZone of zonesToProcess) {
      // 1. Fetch locations for the zone (if id > 0)
      let locationsSummary = '';
      if (wcZone.id > 0) {
        try {
          const locRes = await fetch(`${baseUrl}/wp-json/wc/v3/shipping/zones/${wcZone.id}/locations`, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
            cache: 'no-store'
          });
          if (locRes.ok) {
            const locData = await locRes.json();
            if (Array.isArray(locData) && locData.length > 0) {
              const codes = locData.map((l: any) => l.code).filter(Boolean);
              if (codes.length > 0) {
                locationsSummary = ` (${codes.join(', ')})`;
              }
            }
          }
        } catch (e) {
          console.warn(`Could not fetch locations for zone ${wcZone.id}`, e);
        }
      }

      // 2. Fetch shipping methods for this zone
      const methodsUrl = `${baseUrl}/wp-json/wc/v3/shipping/zones/${wcZone.id}/methods`;
      const methodsRes = await fetch(methodsUrl, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (!methodsRes.ok) {
        continue;
      }

      const methods = await methodsRes.json();
      if (!Array.isArray(methods) || methods.length === 0) {
        // If it's zone 0 and has no methods, skip it
        if (wcZone.id === 0) continue;
      }

      const zoneName = (wcZone.name || `Zona ${wcZone.id}`).trim();

      // Upsert the zone in Prisma
      const dbZone = await prisma.shippingZone.upsert({
        where: { name: zoneName },
        update: { isActive: true },
        create: { name: zoneName, isActive: true }
      });
      importedZonesCount++;

      const zoneMethodsSummary: string[] = [];

      for (const m of (methods || [])) {
        const title = m.settings?.title?.value || m.title || m.method_title || 'Taxa Fixa';
        let rate = 0;
        if (m.settings?.cost?.value) {
          const parsed = parseFloat(String(m.settings.cost.value).replace(/[^0-9.]/g, ''));
          if (!isNaN(parsed)) rate = parsed;
        }

        let minOrderAmount: number | null = null;
        if (m.settings?.min_amount?.value) {
          const parsedMin = parseFloat(String(m.settings.min_amount.value).replace(/[^0-9.]/g, ''));
          if (!isNaN(parsedMin)) minOrderAmount = parsedMin;
        }

        // Upsert or create shipping method
        const existing = await prisma.shippingMethod.findFirst({
          where: { zoneId: dbZone.id, type: title }
        });

        if (existing) {
          await prisma.shippingMethod.update({
            where: { id: existing.id },
            data: {
              rate,
              minOrderAmount,
              isActive: m.enabled !== false
            }
          });
        } else {
          await prisma.shippingMethod.create({
            data: {
              zoneId: dbZone.id,
              type: title,
              rate,
              minOrderAmount,
              isActive: m.enabled !== false
            }
          });
        }
        importedMethodsCount++;
        zoneMethodsSummary.push(`${title}: ${rate}€`);
      }

      importedSummary.push({
        zone: zoneName,
        locations: locationsSummary,
        methods: zoneMethodsSummary
      });
    }

    revalidatePath('/admin/shipping');
    revalidatePath('/checkout');
    return {
      success: true,
      zonesCount: importedZonesCount,
      methodsCount: importedMethodsCount,
      summary: importedSummary
    };
  } catch (error: any) {
    console.error('Error importing WooCommerce shipping:', error);
    return { success: false, message: error.message || 'Erreur lors de l\'import des zones et méthodes de livraison.' };
  }
}

/**
 * Fast SEO synchronizer: Updates only metaTitle, metaDescription and GTIN from RankMath/Yoast
 * without downloading images or re-creating variations. Very fast (100 products per API page).
 */
export async function syncWooCommerceRankMathSEO(
  url: string,
  consumerKey: string,
  consumerSecret: string
) {
  await requireAdmin();

  const baseUrl = url.replace(/\/$/, '');
  const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  let updatedProductsCount = 0;
  let updatedCategoriesCount = 0;
  let totalProductsScanned = 0;

  try {
    // 1. Sync Categories SEO
    const catResponse = await fetch(`${baseUrl}/wp-json/wc/v3/products/categories?per_page=100&hide_empty=false`, {
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (catResponse.ok) {
      const remoteCategories = await catResponse.json();
      if (Array.isArray(remoteCategories)) {
        for (const wcCat of remoteCategories) {
          const catSeo = extractRankMathSEO(wcCat.meta_data, wcCat);
          if (catSeo.metaTitle || catSeo.metaDescription || catSeo.metaKeywords) {
            const cleanName = unescapeHtml(wcCat.name || '').trim();
            const cleanSlug = wcCat.slug;

            const localCat = await prisma.category.findFirst({
              where: {
                OR: [
                  { slug: cleanSlug },
                  { name: cleanName }
                ]
              }
            });

            if (localCat) {
              await prisma.category.update({
                where: { id: localCat.id },
                data: {
                  ...(catSeo.metaTitle ? { metaTitle: catSeo.metaTitle } : {}),
                  ...(catSeo.metaDescription ? { metaDescription: catSeo.metaDescription } : {}),
                  ...(catSeo.metaKeywords ? { metaKeywords: catSeo.metaKeywords } : {}),
                }
              });
              updatedCategoriesCount++;
            }
          }
        }
      }
    }

    // 2. Sync Products SEO (100 per page)
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 20) {
      const prodResponse = await fetch(`${baseUrl}/wp-json/wc/v3/products?per_page=100&page=${page}`, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (!prodResponse.ok) {
        throw new Error(`Erreur API WooCommerce: ${prodResponse.status} ${prodResponse.statusText}`);
      }

      const prods = await prodResponse.json();
      if (!Array.isArray(prods) || prods.length === 0) {
        hasMore = false;
        break;
      }

      totalProductsScanned += prods.length;

      for (const wcProduct of prods) {
        const seo = extractRankMathSEO(wcProduct.meta_data, wcProduct);
        if (seo.metaTitle || seo.metaDescription || seo.gtin) {
          const decodedTitle = unescapeHtml(wcProduct.name || '');
          const rawTitle = wcProduct.name || '';
          const baseSlug = wcProduct.slug;

          const localProduct = await prisma.product.findFirst({
            where: {
              OR: [
                { slug: baseSlug },
                { title: decodedTitle },
                { title: rawTitle },
                ...(baseSlug ? [{ slug: { startsWith: `${baseSlug}-` } }] : [])
              ]
            },
            select: { id: true }
          });

          if (localProduct) {
            await prisma.product.update({
              where: { id: localProduct.id },
              data: {
                ...(seo.metaTitle ? { metaTitle: seo.metaTitle } : {}),
                ...(seo.metaDescription ? { metaDescription: seo.metaDescription } : {}),
                ...(seo.gtin ? { gtin: seo.gtin } : {}),
              }
            });
            updatedProductsCount++;
          }
        }
      }

      page++;
    }

    // 3. Sync Pages SEO
    let updatedPagesCount = 0;
    try {
      const pagesResponse = await fetch(`${baseUrl}/wp-json/wp/v2/pages?_embed=true&per_page=100`, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      if (pagesResponse.ok) {
        const remotePages = await pagesResponse.json();
        if (Array.isArray(remotePages)) {
          for (const wpPage of remotePages) {
            const cleanTitle = unescapeHtml(wpPage.title?.rendered || '').trim();
            const pageSlug = wpPage.slug;
            const pageSeo = extractRankMathSEO(
              wpPage.meta_data || wpPage.meta,
              { title: cleanTitle, description: wpPage.content?.rendered, short_description: wpPage.excerpt?.rendered },
              wpPage
            );
            if (pageSeo.metaTitle || pageSeo.metaDescription || pageSeo.metaKeywords) {
              const localPage = await prisma.page.findFirst({
                where: { OR: [{ slug: pageSlug }, { title: cleanTitle }] }
              });
              if (localPage) {
                await prisma.page.update({
                  where: { id: localPage.id },
                  data: {
                    ...(pageSeo.metaTitle ? { metaTitle: pageSeo.metaTitle } : {}),
                    ...(pageSeo.metaDescription ? { metaDescription: pageSeo.metaDescription } : {}),
                    ...(pageSeo.metaKeywords ? { metaKeywords: pageSeo.metaKeywords } : {}),
                  }
                });
                updatedPagesCount++;
              }
            }
          }
        }
      }
    } catch (pageErr) {
      console.warn('Warning syncing pages SEO:', pageErr);
    }

    // 4. Sync Blog Articles SEO
    let updatedArticlesCount = 0;
    try {
      const postsResponse = await fetch(`${baseUrl}/wp-json/wp/v2/posts?_embed=true&per_page=100`, {
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      if (postsResponse.ok) {
        const remotePosts = await postsResponse.json();
        if (Array.isArray(remotePosts)) {
          for (const wpPost of remotePosts) {
            const cleanTitle = unescapeHtml(wpPost.title?.rendered || '').trim();
            const postSlug = wpPost.slug;
            const postSeo = extractRankMathSEO(
              wpPost.meta_data || wpPost.meta,
              { title: cleanTitle, description: wpPost.content?.rendered, short_description: wpPost.excerpt?.rendered },
              wpPost
            );
            if (postSeo.metaTitle || postSeo.metaDescription || postSeo.metaKeywords) {
              const localArticle = await prisma.article.findFirst({
                where: { OR: [{ slug: postSlug }, { title: cleanTitle }] }
              });
              if (localArticle) {
                await prisma.article.update({
                  where: { id: localArticle.id },
                  data: {
                    ...(postSeo.metaTitle ? { metaTitle: postSeo.metaTitle } : {}),
                    ...(postSeo.metaDescription ? { metaDescription: postSeo.metaDescription } : {}),
                    ...(postSeo.metaKeywords ? { metaKeywords: postSeo.metaKeywords } : {}),
                  }
                });
                updatedArticlesCount++;
              }
            }
          }
        }
      }
    } catch (artErr) {
      console.warn('Warning syncing articles SEO:', artErr);
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/categories');
    revalidatePath('/admin/pages');
    revalidatePath('/admin/blogs');
    revalidatePath('/sitemap.xml');

    return {
      success: true,
      updatedProductsCount,
      updatedCategoriesCount,
      updatedPagesCount,
      updatedArticlesCount,
      totalProductsScanned,
      message: `Sincronização SEO concluída com sucesso! ${updatedProductsCount} produtos, ${updatedCategoriesCount} categorias, ${updatedPagesCount} páginas e ${updatedArticlesCount} artigos atualizados com os dados RankMath / Yoast.`
    };
  } catch (error: any) {
    console.error('Error syncing RankMath SEO:', error);
    return {
      success: false,
      message: error.message || 'Erro durante a sincronização dos dados SEO do RankMath.'
    };
  }
}
