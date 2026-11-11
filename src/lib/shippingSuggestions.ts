// src/lib/shippingSuggestions.ts
// Sepette ücretsiz kargo eşiğine kalan tutarı tamamlayacak kahve önerileri.
//
// Algoritma:
//  1. Aday havuzu: satıştaki tüm kahve varyantları. Sepette zaten bulunan ürünler,
//     kahve olmayan ürünler (künye bilgisi olmayanlar, ör. makine) ve stokta olmayan varyantlar çıkarılır.
//  2. Her aday için "tamamlama gücü" hesaplanır:
//     - Varyant kendisi ücretsiz kargolu ise (etiket / meta alan) eşiği tek başına kapatır.
//     - Aksi halde fiyatı, olası sepet indirimleri (2. ürüne %15, 3. ürüne %20 gibi) düşülerek
//       temkinli tahmin edilir: fiyat × (1 − DISCOUNT_BUFFER). Bu tutar kalan tutarı karşılıyorsa "garanti".
//     - Liste fiyatı karşılıyor ama indirimli tahmin karşılamıyorsa "muhtemel".
//     - Hiçbiri karşılamıyorsa "kısmi" (eşiğe yaklaştırır).
//  3. Sıralama: garanti > muhtemel > kısmi. Aynı grupta müşteriye en az ek harcatan (eşiği en az aşan)
//     önce gelir; kısmi grupta eşiğe en çok yaklaştıran önce gelir. Sepetteki kahvelerle aynı türden
//     (filtre / espresso / türk kahvesi) olan adaylar küçük bir bonus alır.
//  4. Her üründen en fazla bir varyant önerilir; en fazla `limit` öneri döner.

import type { CoffeeProduct, ProductVariant } from './shopify';
import { hasFreeShipping } from './shipping';

/** Sepete eklenen ürüne uygulanabilecek en yüksek otomatik indirim oranı (tahmini) */
export const DISCOUNT_BUFFER = 0.2;
/** Sepetle aynı türdeki adaya verilen bonus (TL cinsinden eşik aşımından düşülür) */
const AFFINITY_BONUS = 40;

const COFFEE_TYPES = ['filtre', 'espresso', 'turk-kahvesi', 'türk kahvesi', 'turk kahvesi'];

export type SuggestionFit = 'free' | 'sure' | 'likely' | 'partial';

export interface ShippingSuggestion {
  product: CoffeeProduct;
  variant: ProductVariant;
  price: number;
  fit: SuggestionFit;
}

interface CartLike {
  handle?: string;
  category?: string[];
  isSubscription?: boolean;
}

const parsePrice = (value?: string) =>
  parseFloat(String(value ?? '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

const coffeeTypes = (tags: string[] = []) => {
  const lower = tags.map((t) => t.trim().toLowerCase());
  return COFFEE_TYPES.filter((type) => lower.includes(type));
};

const isCoffee = (p: CoffeeProduct) =>
  p.notes.length > 0 || Boolean(p.origin) || coffeeTypes(p.category).length > 0;

const FIT_RANK: Record<SuggestionFit, number> = { free: 0, sure: 0, likely: 1, partial: 2 };

export function suggestForFreeShipping(
  products: CoffeeProduct[],
  cartItems: CartLike[],
  remaining: number,
  limit = 2,
): ShippingSuggestion[] {
  if (remaining <= 0) return [];

  const inCart = new Set(cartItems.map((i) => i.handle).filter(Boolean));
  const cartTypes = new Set(cartItems.flatMap((i) => coffeeTypes(i.category)));

  const scored: { s: ShippingSuggestion; score: number }[] = [];

  for (const product of products) {
    if (inCart.has(product.handle) || !isCoffee(product)) continue;
    const affinity = coffeeTypes(product.category).some((t) => cartTypes.has(t)) ? AFFINITY_BONUS : 0;

    let best: { s: ShippingSuggestion; score: number } | null = null;
    for (const variant of product.variants) {
      if (variant.available === false) continue;
      const price = parsePrice(variant.price);
      if (price <= 0) continue;

      let fit: SuggestionFit;
      if (hasFreeShipping({ category: product.category, freeShipping: variant.freeShipping })) fit = 'free';
      else if (price * (1 - DISCOUNT_BUFFER) >= remaining) fit = 'sure';
      else if (price >= remaining) fit = 'likely';
      else fit = 'partial';

      // Düşük skor = daha iyi. Grup önceliği büyük bir katsayıyla ayrılır.
      // kısmi: eşiğe en az kalan iyi; diğerleri: eşiği en az aşan iyi
      // (ücretsiz kargolu varyant eşiğin altında kalsa da kargoyu kapattığı için aşım 0 sayılır)
      const withinGroup = fit === 'partial' ? remaining - price : Math.max(0, price - remaining);
      const score = FIT_RANK[fit] * 100000 + withinGroup - affinity;

      if (!best || score < best.score) best = { s: { product, variant, price, fit }, score };
    }
    if (best) scored.push(best);
  }

  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.s);
}
