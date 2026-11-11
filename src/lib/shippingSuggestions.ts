// src/lib/shippingSuggestions.ts
// Sepet çekmecesi ve ödeme sayfasındaki kahve önerileri.
//
// Çapraz öneri kuralı (her durumda geçerli):
//   espresso alana → filtre + türk kahvesi
//   türk kahvesi alana → filtre + espresso
//   filtre alana → türk kahvesi + espresso
// Yani sepette bulunmayan kahve türleri önerilir. Sepette hiç kahve türü yoksa (ör. yalnızca paket)
// ya da üç tür de varsa, tüm türler aday olur.
//
// İki mod var:
//  A) Ücretsiz kargo eşiğine tutar kalmışsa — eşiği tamamlama:
//     - Her aday varyant için "tamamlama gücü" hesaplanır:
//       • Varyant kendisi ücretsiz kargolu ise (etiket / meta alan) eşiği tek başına kapatır.
//       • Aksi halde fiyatı, olası sepet indirimleri (2. ürüne %15, 3. ürüne %20 gibi) düşülerek
//         temkinli tahmin edilir: fiyat × (1 − DISCOUNT_BUFFER). Karşılıyorsa "garanti".
//       • Liste fiyatı karşılıyor ama indirimli tahmin karşılamıyorsa "muhtemel".
//       • Hiçbiri karşılamıyorsa "kısmi" (eşiğe yaklaştırır).
//     - Sıralama: garanti > muhtemel > kısmi; aynı grupta müşteriye en az ek harcatan önce,
//       kısmi grupta eşiğe en çok yaklaştıran önce.
//  B) Kargo zaten ücretsizse (eşik aşıldı ya da sepette ücretsiz kargolu ürün var) — tanıştırma:
//     - Her önerilen türden en uygun fiyatlı giriş varyantı önerilir (denemesi kolay olsun diye).
//
// Her iki modda da önce farklı türlerden birer öneri seçilir, sonra kalan yer doldurulur.
// Sepette zaten bulunan ürünler, kahve olmayan ürünler ve stokta olmayan varyantlar çıkarılır.
// Her üründen en fazla bir varyant önerilir; en fazla `limit` öneri döner.

import type { CoffeeProduct, ProductVariant } from './shopify';
import { hasFreeShipping } from './shipping';

/** Sepete eklenen ürüne uygulanabilecek en yüksek otomatik indirim oranı (tahmini) */
export const DISCOUNT_BUFFER = 0.2;

export type CoffeeType = 'espresso' | 'filtre' | 'turk-kahvesi';
const ALL_TYPES: CoffeeType[] = ['espresso', 'filtre', 'turk-kahvesi'];

export const COFFEE_TYPE_LABELS: Record<CoffeeType, string> = {
  espresso: 'Espresso',
  filtre: 'Filtre kahve',
  'turk-kahvesi': 'Türk kahvesi',
};

/** Shopify etiketlerini kanonik kahve türlerine çevirir */
const TAG_TO_TYPE: Record<string, CoffeeType> = {
  espresso: 'espresso',
  filtre: 'filtre',
  'turk-kahvesi': 'turk-kahvesi',
  'türk kahvesi': 'turk-kahvesi',
  'turk kahvesi': 'turk-kahvesi',
};

/** `free` = varyant kendisi ücretsiz kargolu; `discover` = kargo zaten ücretsiz, tanıştırma önerisi */
export type SuggestionFit = 'free' | 'sure' | 'likely' | 'partial' | 'discover';

export interface ShippingSuggestion {
  product: CoffeeProduct;
  variant: ProductVariant;
  price: number;
  fit: SuggestionFit;
  /** Önerinin ait olduğu kahve türü (varsa) */
  type?: CoffeeType;
}

interface CartLike {
  handle?: string;
  category?: string[];
  isSubscription?: boolean;
}

const parsePrice = (value?: string) =>
  parseFloat(String(value ?? '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

export const coffeeTypes = (tags: string[] = []): CoffeeType[] => {
  const set = new Set<CoffeeType>();
  for (const tag of tags) {
    const type = TAG_TO_TYPE[tag.trim().toLowerCase()];
    if (type) set.add(type);
  }
  return [...set];
};

const isCoffee = (p: CoffeeProduct) =>
  p.notes.length > 0 || Boolean(p.origin) || coffeeTypes(p.category).length > 0;

/** Sepetteki türlere göre önerilecek türler (sepette olmayanlar) */
export function targetTypes(cartItems: CartLike[]): CoffeeType[] {
  const inCart = new Set(cartItems.flatMap((i) => coffeeTypes(i.category)));
  const missing = ALL_TYPES.filter((t) => !inCart.has(t));
  return missing.length > 0 ? missing : ALL_TYPES;
}

const FIT_RANK: Record<SuggestionFit, number> = { free: 0, sure: 0, likely: 1, partial: 2, discover: 0 };

type Scored = { s: ShippingSuggestion; score: number };

/** Önce her türden en iyi birer aday, sonra kalan en iyi adaylar */
function pickDiverse(scored: Scored[], types: CoffeeType[], limit: number): ShippingSuggestion[] {
  const sorted = [...scored].sort((a, b) => a.score - b.score);
  const picked: Scored[] = [];
  for (const type of types) {
    if (picked.length >= limit) break;
    const best = sorted.find((x) => x.s.type === type && !picked.includes(x));
    if (best) picked.push(best);
  }
  for (const x of sorted) {
    if (picked.length >= limit) break;
    if (!picked.includes(x)) picked.push(x);
  }
  return picked.sort((a, b) => a.score - b.score).map((x) => x.s);
}

export function suggestForFreeShipping(
  products: CoffeeProduct[],
  cartItems: CartLike[],
  remaining: number,
  limit = 2,
): ShippingSuggestion[] {
  const inCart = new Set(cartItems.map((i) => i.handle).filter(Boolean));
  const types = targetTypes(cartItems);
  const discoverMode = remaining <= 0;

  const build = (allowed: Set<CoffeeType> | null): Scored[] => {
    const scored: Scored[] = [];
    for (const product of products) {
      if (inCart.has(product.handle) || !isCoffee(product)) continue;
      const productTypes = coffeeTypes(product.category);
      const type = productTypes.find((t) => !allowed || allowed.has(t));
      if (allowed && !type) continue;

      let best: Scored | null = null;
      for (const variant of product.variants) {
        if (variant.available === false) continue;
        const price = parsePrice(variant.price);
        if (price <= 0) continue;

        let fit: SuggestionFit;
        let score: number;
        if (discoverMode) {
          // Kargo zaten ücretsiz: en uygun giriş fiyatı önce
          fit = 'discover';
          score = price;
        } else {
          if (hasFreeShipping({ category: product.category, freeShipping: variant.freeShipping })) fit = 'free';
          else if (price * (1 - DISCOUNT_BUFFER) >= remaining) fit = 'sure';
          else if (price >= remaining) fit = 'likely';
          else fit = 'partial';
          // Düşük skor = daha iyi. Grup önceliği büyük bir katsayıyla ayrılır.
          // kısmi: eşiğe en az kalan iyi; diğerleri: eşiği en az aşan iyi
          // (ücretsiz kargolu varyant eşiğin altında kalsa da kargoyu kapattığı için aşım 0 sayılır)
          const withinGroup = fit === 'partial' ? remaining - price : Math.max(0, price - remaining);
          score = FIT_RANK[fit] * 100000 + withinGroup;
        }

        if (!best || score < best.score) best = { s: { product, variant, price, fit, type }, score };
      }
      if (best) scored.push(best);
    }
    return scored;
  };

  let scored = build(new Set(types));
  // Önerilecek türde uygun ürün yoksa tüm kahvelere dön
  if (scored.length === 0) scored = build(null);

  return pickDiverse(scored, types, limit);
}
