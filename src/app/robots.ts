import { MetadataRoute } from 'next';
import { getCachedSettings } from '@/lib/cache';
import { SITE_URL } from '@/lib/site';

// Aggressive bots and scrapers that waste Serverless Active CPU quota
const BLOCKED_SCRAPERS = [
  'AhrefsBot',
  'SemrushBot',
  'DotBot',
  'MJ12bot',
  'PetalBot',
  'Bytespider',
  'GPTBot',
  'ChatGPT-User',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-Web',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Barkrowler',
  'BLEXBot',
  'SEOkicks',
];

// Query combinations and internal endpoints that must never be crawled
const DEFAULT_DISALLOW_PATTERNS = [
  '/admin/',
  '/admin/*',
  '/account/',
  '/account/*',
  '/checkout/',
  '/checkout/*',
  '/api/',
  '/api/*',
  '/_next/',
  '/search',
  '/search/*',
  '/*?*',
  '/*?sort=*',
  '/*?page=*',
  '/*?filter=*',
  '/*?minPrice=*',
  '/*?maxPrice=*',
  '/*?rating=*',
  '/*?brand=*',
  '/*?category=*',
  '/*?q=*',
  '/*?view=*',
  '/*?filter_cat=*',
  '/*?add-to-cart=*',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = SITE_URL;

  // Use cached settings to prevent database query on every robots.txt hit
  const settingsMap = await getCachedSettings();

  let disallowPaths: string[] = DEFAULT_DISALLOW_PATTERNS;
  if (settingsMap['ROBOTS_DISALLOW_PATHS']) {
    try {
      const customPaths = JSON.parse(settingsMap['ROBOTS_DISALLOW_PATHS']);
      if (Array.isArray(customPaths)) {
        disallowPaths = Array.from(new Set([...DEFAULT_DISALLOW_PATTERNS, ...customPaths]));
      }
    } catch {
      disallowPaths = DEFAULT_DISALLOW_PATTERNS;
    }
  }

  const crawlDelay = settingsMap['ROBOTS_CRAWL_DELAY']
    ? parseInt(settingsMap['ROBOTS_CRAWL_DELAY'], 10)
    : undefined;

  // Build rules array: Block aggressive scrapers entirely + protect general search query space
  const scraperRules = BLOCKED_SCRAPERS.map(userAgent => ({
    userAgent,
    disallow: ['/'],
  }));

  const standardRule = {
    userAgent: '*',
    allow: ['/', '/shop', '/blog', '/produto/*'],
    disallow: disallowPaths,
    ...(crawlDelay && !isNaN(crawlDelay) ? { crawlDelay } : {}),
  };

  return {
    rules: [standardRule, ...scraperRules],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
