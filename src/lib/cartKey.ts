// src/lib/cartKey.ts
// Sepet satırının kalıcı anahtarı: aynı varyant + aynı öğütme = aynı satır.
// Sepete her eklemede yeni id üretmek yerine bu anahtar kullanılır; böylece aynı ürün
// tekrar eklendiğinde adet artar ve Shopify'ın birleştirdiği satırla birebir eşleşir.

export const GRIND_ATTRIBUTE_KEY = 'Öğütme Derecesi';

// Öğütme adlarının tek yazımı (ürün sayfası ve hızlı ekleme bu adları kullanır).
// Eski hızlı ekleme penceresi "ESPRESSO", "KAĞIT FİLTRE" gibi büyük harfle kaydediyordu.
const GRIND_NAMES = ['Çekirdek', 'Espresso', 'French Press', 'V60', 'Chemex', 'Kağıt Filtre'];

/** "ESPRESSO" → "Espresso", "KAĞIT FİLTRE" → "Kağıt Filtre"; bilinmeyen değerler aynen döner */
export function canonicalGrind(grind?: string | null): string | undefined {
  if (!grind) return grind ?? undefined;
  const upper = grind.trim().toLocaleUpperCase('tr-TR');
  return GRIND_NAMES.find((g) => g.toLocaleUpperCase('tr-TR') === upper) ?? grind;
}

export function cartItemKey(variantId?: string | null, grind?: string | null): string {
  return `${variantId ?? ''}::${grind ?? ''}`;
}

interface KeyableItem {
  id?: string | number;
  variantId?: string;
  grind?: string;
  name?: string;
  quantity: number;
  isSubscription?: boolean;
}

/**
 * Eski sürümde her eklemede zaman damgalı id verildiği için aynı ürün birden fazla
 * kayıt olarak saklanmış olabilir. Bu kayıtları anahtarına göre birleştirir.
 */
export function normalizeCartItems<T extends KeyableItem>(items: T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of items) {
    // Varyantı olmayan (eski/özel) kayıtlara dokunma
    if (!item.variantId || item.isSubscription) {
      merged.set(`raw::${String(item.id)}::${merged.size}`, item);
      continue;
    }
    // Eski büyük harfli öğütme adlarını tek yazıma çevir ("ESPRESSO" → "Espresso")
    const grind = canonicalGrind(item.grind);
    const name = item.grind && grind !== item.grind && item.name
      ? item.name.replace(`(${item.grind})`, `(${grind})`)
      : item.name;
    const key = cartItemKey(item.variantId, grind);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      merged.set(key, { ...item, id: key, grind, name });
    }
  }
  return [...merged.values()];
}
