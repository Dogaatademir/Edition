// src/lib/shipping.ts
// Ücretsiz kargo hesabı — ürün sayfası, sepet çekmecesi ve ödeme sayfası aynı mantığı kullanır.
//
// İki kural var:
//  1. Genel kural: FREE_SHIPPING_THRESHOLD ve üzeri siparişlerde kargo ücretsiz.
//  2. Ürüne özel kural: Sepette Shopify'da FREE_SHIPPING_TAG etiketi verilmiş en az bir ürün
//     (ya da custom.ucretsiz_kargo meta alanı açık bir varyant) varsa, sepete başka ürünler eklense de siparişin tamamı ücretsiz kargoyla gönderilir.
//
// Not: Bu yalnızca sitedeki gösterimdir. Shopify ödeme sayfasının da aynı kuralı uygulaması
// gerekir: bkz. shopify-ucretsiz-kargo/ (Shopify indirim fonksiyonu, aynı etiketi okur).

export const FREE_SHIPPING_THRESHOLD = 850;
export const FREE_SHIPPING_TAG = 'ucretsiz-kargo';

interface ShippableItem {
  category?: string[];
  freeShipping?: boolean;
  price?: string | number;
  quantity?: number;
}

/**
 * Ücretsiz kargo iki şekilde tanımlanabilir:
 *  - Ürün etiketi `ucretsiz-kargo` → ürünün tüm varyantları
 *  - Varyant meta alanı `custom.ucretsiz_kargo` = true → yalnızca o varyant
 *    (sepet satırına ve seçili varyanta `freeShipping: true` olarak taşınır)
 */
export function hasFreeShipping(
  item: { category?: string[]; freeShipping?: boolean } | null | undefined,
): boolean {
  if (item?.freeShipping === true) return true;
  return (item?.category ?? []).some((tag) => tag.trim().toLowerCase() === FREE_SHIPPING_TAG);
}

const parsePrice = (value: string | number | undefined) =>
  parseFloat(String(value ?? 0).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

const lineTotal = (item: ShippableItem) => parsePrice(item.price) * (item.quantity ?? 1);

export interface ShippingStatus {
  /** Sepette ücretsiz kargolu ürün olduğu için sipariş ücretsiz kargolu */
  freeByProduct: boolean;
  /** Eşiğe kalan tutar */
  remaining: number;
  /** İlerleme çubuğu yüzdesi (0–100) */
  progress: number;
  /** Siparişin kargosu ücretsiz */
  isFree: boolean;
}

/**
 * @param items             Sepet satırları (category = Shopify etiketleri)
 * @param cartTotalOverride Eşik için kullanılacak tutar (ör. Shopify'dan gelen indirimli ara toplam)
 */
export function getShippingStatus(items: ShippableItem[], cartTotalOverride?: number): ShippingStatus {
  const freeByProduct = items.some(hasFreeShipping);
  const cartTotal = cartTotalOverride ?? items.reduce((sum, item) => sum + lineTotal(item), 0);

  const remaining = freeByProduct ? 0 : Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const progress = freeByProduct ? 100 : Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100);

  return { freeByProduct, remaining, progress, isFree: remaining === 0 };
}

const formatTL = (value: number) => value.toLocaleString('tr-TR', { minimumFractionDigits: 2 });

/** Sepet ve ödeme sayfasında gösterilecek kısa kargo mesajı */
export function shippingMessage(status: ShippingStatus): { free: boolean; text: string; amount?: string } {
  if (status.freeByProduct) return { free: true, text: 'Siparişinizin tamamı ücretsiz kargo ile gönderilecek.' };
  if (status.isFree) return { free: true, text: 'Sepetiniz ücretsiz kargo hakkı kazandı!' };
  return { free: false, text: 'Ücretsiz Kargo için', amount: `${formatTL(status.remaining)} TL` };
}
