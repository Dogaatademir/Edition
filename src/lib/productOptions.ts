// src/lib/productOptions.ts
// Ürün sayfası ve hızlı ekleme penceresinin ortak fiyat / öğütme yardımcıları
import type { CoffeeProduct } from './shopify';

export const parsePrice = (value?: string) => {
  if (!value) return NaN;
  return parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
};

// "1199.90 ₺" → "1.199,90 ₺" (yalnızca gösterim; hesaplamalar ham değeri kullanır)
export const formatPriceTR = (value?: string) => {
  const n = parsePrice(value);
  if (!value || isNaN(n)) return value;
  return `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
};

export const formatTL = (n: number) =>
  `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

// Varyant adından gramajı okur: "250 gr" → 250, "1 kg" → 1000; set/çoklu paketlerde (ör. "4 x 100 gr") null
export const variantGrams = (weight?: string) => {
  if (!weight || /x/i.test(weight)) return null;
  const m = weight.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|gr|g)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  return m[2].toLowerCase() === 'kg' ? n * 1000 : n;
};

/** İndirim oranı (yalnızca eski fiyat yeni fiyattan yüksekse) */
export const discountPercentOf = (price?: string, oldPrice?: string) => {
  const cur = parsePrice(price);
  const old = parsePrice(oldPrice);
  if (isNaN(cur) || isNaN(old) || old <= cur || cur <= 0) return null;
  return Math.round(((old - cur) / old) * 100);
};

/** Öğütme seçimi gereken ürün (filtre / espresso) */
export const needsGrind = (product: Pick<CoffeeProduct, 'category'>) =>
  product.category.includes('filtre') || product.category.includes('espresso');

// ─── Öğütme seçenekleri ──────────────────────────────────────────────────────

export const grindOptions = [
  { id: 'Çekirdek',      image: '/highlightcovers/cekirdek.png',     hint: 'Öğütülmeden, çekirdek halinde' },
  { id: 'Espresso',      image: '/highlightcovers/espresso.png',     hint: 'Espresso makinesi için ince' },
  { id: 'French Press',  image: '/highlightcovers/french_press.png', hint: 'French press için kalın' },
  { id: 'V60',           image: '/highlightcovers/v60.png',          hint: 'Pour-over için orta-ince' },
  { id: 'Chemex',        image: '/highlightcovers/chemex.png',       hint: 'Chemex için orta-kalın' },
  { id: 'Kağıt Filtre',  image: '/highlightcovers/kagit_filtre.png', hint: 'Filtre kahve makinesi için orta' },
];

