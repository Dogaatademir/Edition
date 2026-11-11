// src/components/ProductOptions.tsx
// Ürün sayfası ile hızlı ekleme penceresinin ortak parçaları: fiyat satırı, kahve künyesi,
// gramaj seçimi, öğütme seçimi ve adet seçici. İkisi aynı görünsün diye tek yerde tutulur.
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Coffee, Minus, Plus, Truck } from 'lucide-react';
import type { CoffeeProduct, ProductVariant } from '../lib/shopify';
import {
  parsePrice,
  formatPriceTR,
  formatTL,
  variantGrams,
  discountPercentOf,
  grindOptions,
} from '../lib/productOptions';

// ─── Öğütme seçenekleri ──────────────────────────────────────────────────────

// Öğütme görselleri 300x150; ikon üst-ortada, altında yazı var. Yalnızca ikonu gösterir.
export const GrindIcon = ({ src }: { src: string }) => (
  <span className="relative block h-9 w-12 shrink-0 overflow-hidden">
    <img
      src={src}
      alt=""
      className="absolute left-1/2 top-[-6px] h-[60px] w-[120px] max-w-none -translate-x-1/2 mix-blend-multiply"
    />
  </span>
);

// --- ÖĞÜTME SEÇİMİ (temaya uygun açılır liste) ---
export const GrindDropdown = ({
  value,
  onChange,
  highlight,
  dropUp = false,
}: {
  value: string;
  onChange: (id: string) => void;
  highlight?: boolean;
  /** Liste yukarı açılsın (ör. alttan açılan hızlı ekleme penceresi) */
  dropUp?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = grindOptions.find((o) => o.id === value);

  // Liste ekranın altına taşıyorsa görünür alana kaydır
  useEffect(() => {
    if (!open || dropUp || !ref.current || !listRef.current) return;
    const listBottom = listRef.current.getBoundingClientRect().bottom;
    if (listBottom <= window.innerHeight - 8) return;
    const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 130;
    const top = ref.current.getBoundingClientRect().top + window.scrollY - headerBottom - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [open, dropUp]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-3 border bg-[#fdfaf6] px-4 py-3 text-left transition-colors ${
          highlight
            ? 'border-[#c17a3a] ring-2 ring-[#c17a3a]/30'
            : value
              ? 'border-[#1b1b1b]'
              : 'border-[#1b1b1b]/25 hover:border-[#1b1b1b]'
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selected ? (
            <GrindIcon src={selected.image} />
          ) : (
            <span className="flex h-9 w-12 shrink-0 items-center justify-center border border-[#1b1b1b]/15">
              <Coffee className="h-4 w-4 text-[#7b6a5c]" />
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <span className={`font-sans text-[0.95rem] leading-tight ${selected ? 'text-[#1b1b1b]' : 'text-[#7b6a5c]'}`}>
              {selected ? selected.id : 'Öğütme seçin'}
            </span>
            <span className="truncate font-sans text-[0.78rem] text-[#7b6a5c]">
              {selected ? selected.hint : 'Demleme yönteminize göre öğütürüz'}
            </span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#1b1b1b] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className={`absolute left-0 right-0 z-30 max-h-[60vh] overflow-y-auto border border-[#1b1b1b] bg-[#fdfaf6] shadow-[0_12px_32px_rgba(27,27,27,0.12)] ${
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {grindOptions.map((o) => {
            const isSelected = o.id === value;
            return (
              <li key={o.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 border-b border-[#1b1b1b]/10 px-4 py-2.5 text-left transition-colors last:border-b-0 ${
                    isSelected ? 'bg-[#f0e8dc]' : 'hover:bg-[#f7f0e7]'
                  }`}
                >
                  <GrindIcon src={o.image} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-sans text-[0.95rem] leading-tight text-[#1b1b1b]">{o.id}</span>
                    <span className="font-sans text-[0.78rem] text-[#7b6a5c]">{o.hint}</span>
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-[#c17a3a]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/** Öğütme seçimi: mobilde açılır liste, masaüstünde ikonlu kutular */
export const GrindPicker = ({
  value,
  onChange,
  highlight,
  dropUp,
  alwaysDropdown = false,
}: {
  value: string;
  onChange: (id: string) => void;
  highlight?: boolean;
  dropUp?: boolean;
  /** Masaüstünde de açılır liste (ikonlu kutular yerine) — dar alanlar için */
  alwaysDropdown?: boolean;
}) => (
  <>
    <span className="font-mono text-[0.68rem] md:text-[0.6rem] tracking-[0.15em] text-[#7b6a5c] uppercase block mb-3">Öğütme Derecesi *</span>
    {/* Mobil: açılır liste */}
    <div className={alwaysDropdown ? '' : 'md:hidden'}>
      <GrindDropdown value={value} highlight={highlight && !value} onChange={onChange} dropUp={dropUp} />
    </div>
    {/* Masaüstü: ikonlu seçim kutuları */}
    <div className={alwaysDropdown ? 'hidden' : 'hidden md:grid grid-cols-2 sm:grid-cols-3 gap-3'}>
      {grindOptions.map(({ id, image }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex items-center justify-center p-2 border transition-all duration-300 ${
            value === id ? 'border-[#1b1b1b] opacity-100' : 'border-[#1b1b1b]/15 opacity-40 hover:opacity-70'
          }`}
        >
          <img src={image} alt={id} className="w-full h-auto object-contain" />
        </button>
      ))}
    </div>
  </>
);

// ─── Adet seçici ─────────────────────────────────────────────────────────────

export const QuantitySelector = ({ quantity, setQuantity }: { quantity: number; setQuantity: (q: number) => void }) => (
  <div className="flex shrink-0 items-center border border-[#1b1b1b]/15 h-12 w-28 md:w-32 bg-[#fdfaf6]">
    <button
      type="button"
      aria-label="Adet azalt"
      onClick={() => setQuantity(Math.max(1, quantity - 1))}
      className="flex-1 flex items-center justify-center text-[#1b1b1b] hover:bg-[#f0e8dc] transition-colors h-full border-r border-[#1b1b1b]/15"
    >
      <Minus className="w-4 h-4" />
    </button>
    <span className="flex-1 text-center font-mono font-bold text-[#1b1b1b] text-sm">{quantity}</span>
    <button
      type="button"
      aria-label="Adet artır"
      onClick={() => setQuantity(quantity + 1)}
      className="flex-1 flex items-center justify-center text-[#1b1b1b] hover:bg-[#f0e8dc] transition-colors h-full border-l border-[#1b1b1b]/15"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

// ─── Fiyat satırı ────────────────────────────────────────────────────────────

export const PriceRow = ({
  price,
  oldPrice,
  freeShipping,
  className = '',
}: {
  price?: string;
  oldPrice?: string;
  freeShipping?: boolean;
  className?: string;
}) => {
  const percent = discountPercentOf(price, oldPrice);
  const displayOld = formatPriceTR(oldPrice);
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 md:items-end md:gap-4 border-b border-[#1b1b1b]/15 pb-5 md:pb-6 ${className}`}>
      <span className="whitespace-nowrap font-mono text-[1.4rem] md:text-[1.5rem] text-[#1b1b1b] font-semibold tracking-tight transition-all">
        {formatPriceTR(price)}
      </span>
      {displayOld && (
        <span className="inline-flex items-center gap-2 md:mb-1">
          <span className="whitespace-nowrap font-mono text-[1rem] leading-none text-[#7b6a5c] line-through">
            {displayOld}
          </span>
          {percent !== null && (
            // İndirim rozeti — eski fiyatın sağ yanında
            <span className="whitespace-nowrap bg-[#8b2f22] px-1.5 py-[3px] font-mono text-[0.62rem] font-bold leading-none tracking-[0.04em] text-white">
              -%{percent}
            </span>
          )}
        </span>
      )}
      {freeShipping && (
        <span className="md:mb-1 inline-flex whitespace-nowrap items-center gap-1.5 border border-[#c17a3a] px-2.5 py-1 font-mono text-[0.68rem] md:text-[0.58rem] uppercase tracking-[0.12em] text-[#c17a3a]">
          <Truck className="h-3.5 w-3.5" /> Ücretsiz Kargo
        </span>
      )}
    </div>
  );
};

// ─── Kahve künyesi ───────────────────────────────────────────────────────────

/** Yalnızca Shopify'da dolu olan alanlar gösterilir; hiçbiri yoksa hiçbir şey çizilmez */
export const CoffeeFacts = ({ product, className = '' }: { product: CoffeeProduct; className?: string }) => {
  const rows = [
    { label: 'Menşe', value: product.origin },
    { label: 'İşlem', value: product.process },
    { label: 'Kavrum', value: product.roast },
  ].filter((row) => row.value);
  if (product.notes.length === 0 && rows.length === 0) return null;

  return (
    <section aria-label="Kahve künyesi" className={`border-b border-[#1b1b1b]/15 pb-5 md:pb-6 ${className}`}>
      {product.notes.length > 0 && (
        <div className="mb-4">
          <span className="block font-mono text-[0.68rem] md:text-[0.6rem] tracking-[0.14em] text-[#5c4635] uppercase mb-2">Tadım Notaları</span>
          <ul className="flex flex-wrap gap-2">
            {product.notes.map((note) => (
              <li key={note} className="border border-[#1b1b1b]/20 bg-white/70 px-3 py-1.5 font-sans text-[0.85rem] leading-none text-[#1b1b1b]">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <dl className="grid grid-cols-3 gap-x-4 border-t border-[#1b1b1b]/10 pt-4">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="font-mono text-[0.68rem] md:text-[0.6rem] tracking-[0.14em] text-[#5c4635] uppercase mb-1">{row.label}</dt>
              <dd className="font-sans text-[0.85rem] md:text-[0.9rem] font-medium leading-snug text-[#1b1b1b] break-words">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};

/** Dar alanlar için (hızlı ekleme, mobil): notalar küçük etiket, menşe · işlem · kavrum tek satır */
export const CoffeeFactsCompact = ({
  product,
  className = '',
  notesOnly = false,
}: {
  product: CoffeeProduct;
  className?: string;
  /** Yalnızca tadım notaları (menşe · işlem · kavrum satırı gösterilmez) */
  notesOnly?: boolean;
}) => {
  const facts = notesOnly ? [] : [product.origin, product.process, product.roast].filter(Boolean);
  if (product.notes.length === 0 && facts.length === 0) return null;
  return (
    <section aria-label="Kahve künyesi" className={className}>
      {product.notes.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {product.notes.map((note) => (
            <li key={note} className="border border-[#1b1b1b]/20 bg-white/70 px-2 py-1 font-sans text-[0.72rem] leading-none text-[#1b1b1b]">
              {note}
            </li>
          ))}
        </ul>
      )}
      {facts.length > 0 && (
        <p className="mt-1.5 font-sans text-[0.72rem] leading-snug text-[#5c4635]">{facts.join(' · ')}</p>
      )}
    </section>
  );
};

// ─── Gramaj seçimi ───────────────────────────────────────────────────────────

/**
 * Gramaj satırları: kg fiyatı ve en küçük gramaja göre avantaj.
 * Örn. 100 / 250 / 1000 gr: 250 ve 1000 gr, 100 gr fiyatına göre; 250 / 1000 gr: 1000 gr, 250 gr'a göre.
 */
const makeVariantRowInfo = (variants: ProductVariant[]) => {
  const candidates = variants
    .map((v) => ({ grams: variantGrams(v.weight), price: parsePrice(v.price) }))
    .filter((x): x is { grams: number; price: number } => x.grams !== null && !isNaN(x.price) && x.price > 0);
  const base = candidates.length < 2 ? null : candidates.reduce((min, x) => (x.grams < min.grams ? x : min));

  return (variant: ProductVariant) => {
    const grams = variantGrams(variant.weight);
    const price = parsePrice(variant.price);
    if (isNaN(price)) return { kgPrice: null, compareAt: null, percent: null };
    const kgPrice = grams ? (price / grams) * 1000 : null;
    let compareAt: number | null = null;
    let percent: number | null = null;
    if (base && grams && grams > base.grams) {
      // Aynı miktarı en küçük paketten alsaydı ödeyeceği tutar
      const ref = base.price * (grams / base.grams);
      const pct = Math.round(((ref - price) / ref) * 100);
      if (pct > 0) {
        compareAt = ref;
        percent = pct;
      }
    }
    return { kgPrice, compareAt, percent };
  };
};

export const VariantPicker = ({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedId?: string;
  onSelect: (variant: ProductVariant) => void;
}) => {
  const rowInfo = makeVariantRowInfo(variants);
  return (
    <>
      <span className="font-mono text-[0.68rem] md:text-[0.6rem] tracking-[0.15em] text-[#7b6a5c] uppercase block mb-3">Gramaj Seçimi</span>
      <div role="radiogroup" aria-label="Gramaj" className="flex flex-col gap-2.5">
        {variants.map((variant) => {
          const isSelected = selectedId === variant.id;
          const info = rowInfo(variant);
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(variant)}
              className={`flex w-full items-center gap-3 border px-4 py-1.5 md:py-2.5 text-left transition-colors ${
                isSelected
                  ? 'border-[#1b1b1b] bg-[#f0e8dc]'
                  : 'border-[#1b1b1b]/15 bg-[#fdfaf6] hover:border-[#1b1b1b]/50'
              }`}
            >
              {/* Seçim işareti */}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? 'border-[#1b1b1b]' : 'border-[#1b1b1b]/30'
                }`}
              >
                {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-[#1b1b1b]" />}
              </span>

              {/* Gramaj + kg fiyatı */}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-mono text-[0.9rem] font-semibold uppercase tracking-[0.12em] text-[#1b1b1b]">
                  {variant.weight}
                </span>
                {info.kgPrice !== null && (
                  <span className="font-sans text-[0.72rem] text-[#7b6a5c]">
                    kg fiyatı {formatTL(info.kgPrice)}
                  </span>
                )}
              </span>

              {/* Fiyat (+ en küçük gramaja göre avantaj) */}
              <span className="flex shrink-0 items-center gap-2">
                <span className="flex flex-col items-end">
                  {info.compareAt !== null && (
                    <span className="whitespace-nowrap font-mono text-[0.72rem] text-[#7b6a5c] line-through">
                      {formatTL(info.compareAt)}
                    </span>
                  )}
                  <span className="whitespace-nowrap font-mono text-[0.95rem] font-semibold text-[#1b1b1b]">
                    {formatPriceTR(variant.price)}
                  </span>
                </span>
                {info.percent !== null && (
                  <span className="whitespace-nowrap bg-[#8b2f22] px-1.5 py-[3px] font-mono text-[0.62rem] font-bold leading-none tracking-[0.04em] text-white">
                    -%{info.percent}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};
