// scripts/generate-sitemap.mjs
// Derleme öncesinde public/sitemap.xml dosyasını sabit sayfalar + Shopify ürünleriyle üretir.
// Shopify'a ulaşılamazsa mevcut sitemap'e dokunmaz ve derlemeyi durdurmaz.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEnv } from 'vite';

const SITE_URL = 'https://editioncoffee.com.tr';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'public', 'sitemap.xml');

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/kahveler', changefreq: 'daily', priority: '0.9' },
  { path: '/kahveler/turk-kahvesi', changefreq: 'daily', priority: '0.9' },
  { path: '/kahveler/filtre-kahve', changefreq: 'daily', priority: '0.9' },
  { path: '/kahveler/espresso', changefreq: 'daily', priority: '0.9' },
  { path: '/kahveler/avantajli-paketler', changefreq: 'daily', priority: '0.8' },
  { path: '/hakkimizda', changefreq: 'monthly', priority: '0.6' },
  { path: '/sss', changefreq: 'monthly', priority: '0.5' },
  { path: '/toptan', changefreq: 'monthly', priority: '0.5' },
  { path: '/iletisim', changefreq: 'monthly', priority: '0.4' },
];

const env = { ...loadEnv('production', root, 'VITE_'), ...process.env };
const domain = env.VITE_SHOPIFY_STORE_DOMAIN;
const token = env.VITE_SHOPIFY_STOREFRONT_TOKEN;

async function fetchProducts() {
  const products = [];
  let cursor = null;
  do {
    const res = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({
        query: `query ($cursor: String) {
          products(first: 250, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes { handle updatedAt }
          }
        }`,
        variables: { cursor },
      }),
    });
    if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    const page = json.data.products;
    products.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);
  return products;
}

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function main() {
  if (!domain || !token) {
    console.warn('[sitemap] Shopify ortam değişkenleri yok; mevcut sitemap.xml korunuyor.');
    return;
  }

  let products;
  try {
    products = await fetchProducts();
  } catch (err) {
    console.warn(`[sitemap] Ürünler alınamadı (${err.message}); mevcut sitemap.xml korunuyor.`);
    return;
  }

  const entries = [
    ...STATIC_PAGES.map((p) => urlEntry({ loc: `${SITE_URL}${p.path}`, ...p })),
    ...products.map((p) =>
      urlEntry({
        loc: `${SITE_URL}/urun/${encodeURIComponent(p.handle)}`,
        lastmod: p.updatedAt?.slice(0, 10),
        changefreq: 'weekly',
        priority: '0.8',
      }),
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  await writeFile(outFile, xml, 'utf8');
  console.log(`[sitemap] ${STATIC_PAGES.length} sayfa + ${products.length} ürün yazıldı → public/sitemap.xml`);
}

main();
