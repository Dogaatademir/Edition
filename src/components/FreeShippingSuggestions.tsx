// src/components/FreeShippingSuggestions.tsx
// Sepet çekmecesi ve ödeme sayfasındaki kahve önerileri: eşiğe tutar kalmışsa tamamlayan, kargo ücretsizse farklı türden ürünler.
// Algoritma: lib/shippingSuggestions.ts. Ürün listesi sayfa ömrü boyunca bir kez çekilir.
import { useEffect, useState } from 'react';
import { fetchShopifyProducts, type CoffeeProduct } from '../lib/shopify';
import { suggestForFreeShipping, COFFEE_TYPE_LABELS, type ShippingSuggestion } from '../lib/shippingSuggestions';

let productsPromise: Promise<CoffeeProduct[]> | null = null;
const loadProducts = () => {
  if (!productsPromise) {
    productsPromise = fetchShopifyProducts().catch(() => {
      productsPromise = null;
      return [];
    });
  }
  return productsPromise;
};

const formatTRY = (value: number) =>
  `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const suggestionHint = (s: ShippingSuggestion, remaining: number) => {
  if (s.fit === 'discover') return s.type ? `${COFFEE_TYPE_LABELS[s.type]} de dene` : 'Yeni bir tat keşfet';
  if (s.fit === 'free') return 'Tüm sepet ücretsiz kargo';
  if (s.fit === 'sure') return 'Ücretsiz kargoya ulaştırır';
  if (s.fit === 'likely') return 'Ücretsiz kargoya ulaştırabilir';
  return `Kalan tutar ${formatTRY(Math.max(0, remaining - s.price))}`;
};

const FreeShippingSuggestions = ({
  cartItems,
  remaining,
  onPick,
  layout = 'drawer',
}: {
  cartItems: { handle?: string; category?: string[]; isSubscription?: boolean }[];
  remaining: number;
  onPick: (s: ShippingSuggestion) => void;
  /** page: masaüstünde kartlar yatay (görsel solda) — geniş alanlar için */
  layout?: 'drawer' | 'page';
}) => {
  const [products, setProducts] = useState<CoffeeProduct[]>([]);
  const wide = layout === 'page';

  useEffect(() => {
    let alive = true;
    loadProducts().then((list) => { if (alive) setProducts(list); });
    return () => { alive = false; };
  }, []);

  const suggestions = suggestForFreeShipping(products, cartItems, remaining, 2);
  if (suggestions.length === 0) return null;

  return (
    <div className={`bg-[#FDFAF6] border border-[#1A0F08]/10 shadow-sm px-3 py-3 ${wide ? 'md:p-6' : ''}`}>
      <p className={`mb-2.5 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.15em] text-[#1A0F08] ${wide ? 'md:mb-4 md:text-[0.62rem]' : ''}`}>
        {remaining > 0 ? 'Sepetini tamamla, kargon bizden!' : 'Bunları da denemek ister misin?'}
      </p>
      <ul className={`grid grid-cols-2 gap-2.5 ${wide ? 'md:gap-5' : ''}`}>
        {suggestions.map((s) => {
          const weight = s.variant.weight !== 'Default Title' ? s.variant.weight : '';
          const showWeight = weight && !s.product.name.toLowerCase().includes(weight.toLowerCase());
          const image = s.variant.image || s.product.image;
          return (
            <li key={s.variant.id} className={`flex flex-col ${wide ? 'md:flex-row md:gap-4' : ''}`}>
              <div
                className={`flex aspect-[16/10] w-full items-center justify-center overflow-hidden border border-[#1A0F08]/10 bg-[#F7F0E7] ${
                  wide ? 'md:aspect-auto md:h-28 md:w-24 md:shrink-0' : ''
                }`}
              >
                {image && <img src={image} alt="" className="h-full w-full scale-110 object-contain mix-blend-multiply" />}
              </div>
              <div className={`flex flex-1 flex-col ${wide ? 'md:min-w-0' : ''}`}>
                <p className={`mt-1.5 line-clamp-2 font-serif text-[0.85rem] leading-snug text-[#1A0F08] ${wide ? 'md:mt-0 md:text-[0.95rem]' : ''}`}>
                  {s.product.name}
                  {showWeight && <span className="font-normal text-[#5C4635]"> · {weight}</span>}
                </p>
                <p className="mt-0.5 font-mono text-[0.78rem] font-semibold text-[#1A0F08]">{formatTRY(s.price)}</p>
                <p className={`mt-0.5 mb-1.5 font-sans text-[0.7rem] leading-snug ${s.fit === 'partial' || s.fit === 'discover' ?'text-[#7B6A5C]' : 'text-[#a64b2a]'}`}>
                  {suggestionHint(s, remaining)}
                </p>
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  className="mt-auto w-full border border-[#1A0F08]/25 py-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#1A0F08] transition-colors hover:bg-[#1A0F08] hover:text-[#FDFAF6]"
                >
                  + Sepete Ekle
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default FreeShippingSuggestions;
