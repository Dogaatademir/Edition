// src/pages/Anasayfa.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { fetchShopifyProducts, fetchShopifyProductByHandle, type CoffeeProduct, type ProductVariant } from "../lib/shopify";

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }

      setProgress(Math.max(0, Math.min(1, -rect.top / scrollable)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [ref]);

  return progress;
}

// ─── QUICK ADD MODAL ──────────────────────────────────────────────────────────
const grindOptions = ["ÇEKİRDEK", "FRENCH PRESS", "V60", "CHEMEX"];

const QuickAddModal = ({
  handle,
  onClose,
}: {
  handle: string;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<CoffeeProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [grind, setGrind] = useState("Çekirdek");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchShopifyProductByHandle(handle)
      .then((data) => {
        setProduct(data);
        if (data?.variants?.length) setSelectedVariant(data.variants[0]);
      })
      .finally(() => setLoading(false));
  }, [handle]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleAdd = () => {
    if (!product) return;
    const isFiltre = product.category.includes("filtre");
    let name = product.name;
    if (selectedVariant && selectedVariant.weight !== "Default Title") name += ` - ${selectedVariant.weight}`;
    if (isFiltre) name += ` (${grind})`;
    addToCart({
      ...product,
      id: Date.now().toString(),
      variantId: selectedVariant?.id ?? product.variants?.[0]?.id,
      name,
      price: selectedVariant?.price ?? product.price,
    } as any, quantity);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 1200);
  };

  const isFiltre = product?.category.includes("filtre");
  const hasVariants = product?.variants?.length && product.variants[0].weight !== "Default Title";
  const displayPrice = selectedVariant?.price ?? product?.price ?? "";
  const displayOldPrice = selectedVariant?.oldPrice ?? product?.oldPrice;

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-[#1b1b1b]/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — mobilde alttan slide, masaüstünde ortalanmış */}
      <div className="fixed inset-x-0 bottom-0 z-[90] md:inset-0 md:flex md:items-center md:justify-center md:p-2">
        <div className="w-full md:max-w-5xl bg-[#fdfaf6] shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300 max-h-[95vh] md:h-[96vh] flex flex-col">

          {/* Kapat butonu */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 text-[#7b6a5c] hover:text-[#1b1b1b] transition-colors bg-[#fdfaf6]/80 p-1"
          >
            <X className="h-5 w-5" />
          </button>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="font-mono text-[0.6rem] tracking-[0.2em] text-[#7b6a5c] animate-pulse">YÜKLENİYOR...</span>
            </div>
          ) : product ? (
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

              {/* Sol: Görsel */}
              <div className="hidden md:flex w-[48%] shrink-0 bg-[#f0e8dc] items-center justify-center p-12">
                {product.image && (
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain max-h-[680px]" />
                )}
              </div>

              {/* Mobil: küçük görsel + başlık yan yana */}
              <div className="flex md:hidden items-center gap-4 px-5 pt-6 pb-4 border-b border-[#1b1b1b]/10">
                {product.image && (
                  <div className="h-20 w-16 shrink-0 bg-[#f0e8dc] flex items-center justify-center overflow-hidden">
                    <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                  </div>
                )}
                <div>
                  <p className="font-mono text-[0.52rem] tracking-[0.15em] text-[#7b6a5c] mb-0.5">{product.origin}</p>
                  <h3 className="font-serif text-[1.1rem] leading-tight text-[#1b1b1b]">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[0.9rem] font-semibold text-[#1b1b1b]">{displayPrice}</span>
                    {displayOldPrice && <span className="font-mono text-[0.72rem] text-[#9b9288] line-through">{displayOldPrice}</span>}
                  </div>
                </div>
              </div>

              {/* Sağ: İçerik */}
              <div className="flex flex-col flex-1 overflow-y-auto p-6 md:p-10 gap-6">

                {/* Masaüstü başlık */}
                <div className="hidden md:block">
                  <p className="font-mono text-[0.55rem] tracking-[0.15em] text-[#7b6a5c] mb-1">{product.origin}</p>
                  <h3 className="font-serif text-[1.6rem] leading-tight text-[#1b1b1b] mb-3">{product.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[1.2rem] font-semibold text-[#1b1b1b]">{displayPrice}</span>
                    {displayOldPrice && <span className="font-mono text-[0.9rem] text-[#9b9288] line-through">{displayOldPrice}</span>}
                  </div>
                </div>

                {/* Kısa açıklama */}
                {product.description && (
                  <p className="font-sans font-light text-[0.85rem] text-[#5c4635] leading-relaxed">{product.description}</p>
                )}

            {/* Varyant seçimi */}
            {hasVariants && (
              <div>
                <span className="font-mono text-[0.58rem] tracking-[0.15em] text-[#7b6a5c] block mb-2">GRAMAJ</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 border font-mono text-[0.6rem] tracking-[0.12em] uppercase transition-colors ${
                        selectedVariant?.id === v.id
                          ? "border-[#1b1b1b] bg-[#1b1b1b] text-[#fdfaf6]"
                          : "border-[#1b1b1b]/20 text-[#5c4635] hover:border-[#1b1b1b]"
                      }`}
                    >
                      {v.weight}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Öğütme seçimi */}
            {isFiltre && (
              <div>
                <span className="font-mono text-[0.58rem] tracking-[0.15em] text-[#7b6a5c] block mb-2">ÖĞÜTME</span>
                <div className="flex flex-wrap gap-2">
                  {grindOptions.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrind(g)}
                      className={`px-4 py-2 border font-mono text-[0.6rem] tracking-[0.12em] uppercase transition-colors ${
                        grind === g
                          ? "border-[#1b1b1b] bg-[#1b1b1b] text-[#fdfaf6]"
                          : "border-[#1b1b1b]/20 text-[#5c4635] hover:border-[#1b1b1b]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Adet + Sepete Ekle */}
            <div className="flex gap-3 mt-1">
              <div className="flex items-center border border-[#1b1b1b]/20 h-12">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 h-full text-[#5c4635] hover:bg-[#f0e8dc] transition-colors border-r border-[#1b1b1b]/20">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-4 font-mono text-[0.75rem] text-[#1b1b1b]">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 h-full text-[#5c4635] hover:bg-[#f0e8dc] transition-colors border-l border-[#1b1b1b]/20">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className={`flex-1 h-12 font-mono text-[0.62rem] tracking-[0.15em] transition-colors border ${
                  added
                    ? "border-[#1b1b1b] bg-[#1b1b1b] text-[#fdfaf6]"
                    : "border-[#c17a3a] bg-[#c17a3a] text-[#fdfaf6] hover:bg-[#a0612a] hover:border-[#a0612a]"
                }`}
              >
                {added ? "✓ EKLENDİ" : "SEPETE EKLE"}
              </button>
            </div>

                {/* Ürüne git */}
                <button
                  onClick={() => { onClose(); navigate(`/urun/${product.handle}`); }}
                  className="text-center font-mono text-[0.58rem] tracking-[0.15em] text-[#7b6a5c] hover:text-[#1b1b1b] transition-colors border-b border-[#7b6a5c]/30 pb-0.5 self-center"
                >
                  ÜRÜN DETAYINA GİT →
                </button>

              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

// ─── ALT BİLEŞEN: ÜRÜN KARTI ─────────────────────────────────────────────────
const ProductCard = ({
  p,
  onQuickAdd,
}: {
  p: CoffeeProduct;
  onQuickAdd: (p: CoffeeProduct) => void;
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const secondImage = p.images && p.images.length > 1 ? p.images[1] : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onQuickAdd(p);
  };

  const getDiscountPercent = () => {
    if (!p.oldPrice) return null;
    try {
      const cleanPrice = (s: string) => {
        const cleanStr = s.replace(/\./g, "").replace(/,/g, ".").replace(/[^\d.]/g, "");
        return parseFloat(cleanStr);
      };
      const oldVal = cleanPrice(p.oldPrice);
      const curVal = cleanPrice(p.price);
      if (!isNaN(oldVal) && !isNaN(curVal) && oldVal > curVal && curVal > 0) {
        return Math.round(((oldVal - curVal) / oldVal) * 100);
      }
    } catch (e) {
      console.warn("Fiyat hesaplama hatası:", e);
    }
    return null;
  };

  const discount = getDiscountPercent();

  return (
    <article
      onClick={() => navigate(`/urun/${p.handle}`)}
      className="group flex w-full cursor-pointer flex-col gap-3"
    >
      <div
        className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-[#f7f0e7]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
      >
        <div className="absolute left-0 top-0 z-10 flex w-full items-start justify-between p-3">
          {p.badge ? (
            <span className="bg-[#1b1b1b] px-2.5 py-1 font-mono text-[0.55rem] tracking-[0.18em] text-[#fbf6ee]">
              {p.badge}
            </span>
          ) : (
            <span />
          )}
          {discount && (
            <span className="border border-[#8b2f22] bg-[#fbf6ee] px-2 py-1 font-mono text-[0.58rem] font-bold tracking-[0.16em] text-[#8b2f22]">
              -%{discount}
            </span>
          )}
        </div>

        {p.image ? (
          <>
            <img
              src={p.image}
              alt={p.name}
              className={`h-full w-full object-contain transition-all duration-500 ease-out group-hover:scale-[1.045] ${secondImage ? (hovered ? 'opacity-0' : 'opacity-100') : ''}`}
              loading="lazy"
            />
            {secondImage && (
              <img
                src={secondImage}
                alt={p.name}
                className={`absolute inset-0 h-full w-full object-contain transition-all duration-500 ease-out group-hover:scale-[1.045] ${hovered ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 80 80" fill="none" className="opacity-20">
              <ellipse cx="40" cy="40" rx="28" ry="36" stroke="#1b1b1b" strokeWidth="1.5" />
              <path d="M40 10 Q55 25 55 40 Q55 55 40 70" stroke="#1b1b1b" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
          </div>
        )}

        <button
          onClick={handleAdd}
          className="absolute inset-x-4 bottom-4 translate-y-3 px-5 py-3 font-mono text-[0.62rem] tracking-[0.18em] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 border border-[#1b1b1b] bg-[#fbf6ee] text-[#1b1b1b] hover:bg-[#1b1b1b] hover:text-[#fbf6ee]"
        >
          + SEPETE EKLE
        </button>
      </div>

      <div>
        <h3 className="font-sans text-[0.95rem] font-medium leading-snug text-[#1b1b1b] transition-colors duration-300 group-hover:text-[#C17A3A]">
          {p.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className={`font-mono text-[0.85rem] font-semibold ${p.oldPrice ? "text-[#8b2f22]" : "text-[#1b1b1b]"}`}>
            {p.price}
          </span>
          {p.oldPrice && (
            <span className="font-mono text-[0.72rem] text-[#9b9288] line-through">
              {p.oldPrice}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

// ─── YÜKLEME İSKELETİ ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex h-full min-w-[240px] animate-pulse flex-col border border-[#1b1b1b]/10 bg-[#fbf6ee]">
    <div className="aspect-[4/5] w-full bg-[#e7ddd1]" />
    <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="h-4 w-4/5 rounded bg-[#ded4c9]" />
      <div className="h-2 w-2/5 rounded bg-[#ded4c9]" />
      <div className="mt-auto h-4 w-1/3 rounded bg-[#ded4c9]" />
    </div>
  </div>
);

// ─── SIKÇA SORULAN SORULAR BİLEŞENİ ───────────────────────────────────────────

const PRODUCT_CATEGORY_LABELS = ["ESPRESSO", "FİLTRE", "TÜRK KAHVESİ"];
const FEATURE_ITEMS = [
  { title: "SİPARİŞE ÖZEL", subtitle: "HER KAVRUM TAZE" },
  { title: "TEK KÖKEN", subtitle: "İZLENEBİLİR ÇEKİRDEK" },
  { title: "SPECIALTY COFFEE", subtitle: "80+ PUAN ÇEKİRDEK" },
  { title: "2022'DAN BERİ", subtitle: "100.000+ MUTLU FİNCAN" },
];

const KAHVE_KATEGORILERI = [
  {
    label: "TÜRK KAHVESİ",
    title: "Gelenekten Gelen Derinlik",
    text: "Yüzyıllık geleneği modern kavrum anlayışıyla buluşturuyoruz. Her fincan, doğru sıcaklıkta, köpüklü ve karakterli.",
    cta: "KEŞFEDİN",
    path: "/kahveler?kategori=turk-kahvesi",
    image: "https://plus.unsplash.com/premium_photo-1732818135469-3bfc10ed83a2?w=900&auto=format&fit=crop&q=60",
  },
  {
    label: "FİLTRE KAHVE",
    title: "Sabahın En Saf Hali",
    text: "Tek köken çekirdekler, hassas demleme profilleri. V60'tan Chemex'e her yöntem için siparişe özel öğütülür.",
    cta: "DEMLEMEYİ SEÇ",
    path: "/kahveler?kategori=filtre",
    image: "https://images.unsplash.com/photo-1638202518327-956c496a5240?w=900&auto=format&fit=crop&q=60",
  },
  {
    label: "ESPRESSO",
    title: "Yoğun, Gövdeli, Unutulmaz",
    text: "Özenle seçilmiş harmanlar, yüksek basınçta sıkıştırılmış lezzet. Evinizdeki espresso deneyimini bir üst seviyeye taşıyın.",
    cta: "HARMANI İNCELE",
    path: "/kahveler?kategori=espresso",
    image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=2000&auto=format&fit=crop",
  },
];

function KahveKategorileriSection() {
  const navigate = useNavigate();
  const stickyRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(stickyRef);
  const activeIndex = Math.min(
    KAHVE_KATEGORILERI.length - 1,
    Math.max(0, Math.floor(progress * KAHVE_KATEGORILERI.length))
  );

  const scrollTo = (index: number) => {
    const el = stickyRef.current;
    if (!el) return;
    const top = el.offsetTop;
    const h = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + h * (index / Math.max(1, KAHVE_KATEGORILERI.length - 1)), behavior: "smooth" });
  };

  return (
    <>
      {/* Masaüstü: sticky horizontal — sol metin, sag yatay kayan video */}
      <div
        ref={stickyRef}
        className="relative hidden border-b border-[#1b1b1b]/10 bg-[#efe5d8] md:block"
        style={{ minHeight: `${KAHVE_KATEGORILERI.length * 100}vh` }}
      >
        <div className="sticky top-[130px] h-[calc(100vh-130px)] overflow-hidden">
          <div className="flex h-full">

            {/* SOL: metin + dot navigasyon (sticky-images-and-text__content) */}
            <div className="relative flex w-1/2 shrink-0 flex-col justify-center overflow-hidden px-16 lg:px-24">

              {/* Metin blokları — üst üste, aktif görünür */}
              <div className="relative w-full">
                {KAHVE_KATEGORILERI.map((step, index) => (
                  <div
                    key={`kat-text-${index}`}
                    style={{
                      transition: "opacity 0.6s ease, transform 0.6s ease",
                      opacity: activeIndex === index ? 1 : 0,
                      transform: activeIndex === index
                        ? "translateY(0)"
                        : index < activeIndex ? "translateY(-16px)" : "translateY(16px)",
                      pointerEvents: activeIndex === index ? "auto" : "none",
                      position: index === 0 ? "relative" : "absolute",
                      inset: index === 0 ? undefined : "0",
                    }}
                  >
                    <p className="font-sans text-[0.9rem] font-medium tracking-[0.2em] text-[#c38152]">
                      {step.label}
                    </p>
                    <h3 className="mt-5 font-serif text-[clamp(1.6rem,2.5vw,2.8rem)] leading-[1.1] tracking-[-0.02em] text-[#1b1b1b]">
                      {step.title}
                    </h3>
                    <p className="mt-6 max-w-[440px] font-sans font-light text-[1rem] leading-relaxed text-[#1b1b1b]/70">
                      {step.text}
                    </p>
                    <button
                      onClick={() => navigate(step.path)}
                      className="mt-8 border border-[#1b1b1b] bg-[#1b1b1b] px-6 py-3 font-mono text-[0.6rem] tracking-[0.2em] text-[#f7f0e7] transition-all hover:bg-transparent hover:text-[#1b1b1b]"
                    >
                      {step.cta}
                    </button>
                  </div>
                ))}
              </div>

              {/* Dot navigasyon — yatay, altta */}
              <div className="absolute bottom-10 left-16 flex items-center gap-2 lg:left-24">
                {KAHVE_KATEGORILERI.map((_, index) => (
                  <button
                    key={`kat-dot-${index}`}
                    type="button"
                    onClick={() => scrollTo(index)}
                    style={{
                      height: 10,
                      width: activeIndex === index ? 25 : 10,
                      borderRadius: 5,
                      border: "1px solid #1b1b1b",
                      background: activeIndex === index ? "#1b1b1b" : "transparent",
                      opacity: activeIndex === index ? 1 : 0.25,
                      transition: "width 0.5s ease, opacity 0.5s ease, background 0.5s ease",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    aria-label={`Adım ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* SAG: video'lar yatay kayan (sticky-images-and-text__aside horizontal) */}
            <div className="relative w-1/2 shrink-0 overflow-hidden">
              <div className="absolute inset-0 p-6 lg:p-8">
                <div className="relative h-full w-full overflow-hidden bg-[#1b1b1b]">
                  {/* Yatay rail */}
                  <div
                    className="flex h-full"
                    style={{
                      width: `${KAHVE_KATEGORILERI.length * 100}%`,
                      transform: `translateX(-${(activeIndex / KAHVE_KATEGORILERI.length) * 100}%)`,
                      transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {KAHVE_KATEGORILERI.map((step, index) => (
                      <div
                        key={`kat-img-${index}`}
                        className="relative h-full shrink-0"
                        style={{ width: `${100 / KAHVE_KATEGORILERI.length}%` }}
                      >
                        <img
                          src={step.image}
                          alt={step.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobil: yatay snap scroll kartlar */}
      <section className="border-b border-[#1b1b1b]/10 bg-[#efe5d8] px-5 py-12 md:hidden">
        <div className="mb-8">
          <p className="mb-3 font-mono text-[0.6rem] tracking-[0.32em] text-[#C17A3A]">SEÇKİMİZ</p>
          <h2 className="font-serif text-[clamp(1.8rem,6vw,2.8rem)] leading-[1.1] tracking-[-0.02em]">Her damak zevkine bir kahve.</h2>
        </div>
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
          {KAHVE_KATEGORILERI.map((step, index) => (
            <article key={`kat-mob-${index}`} className="relative flex min-h-[380px] min-w-[82vw] snap-start flex-col justify-between overflow-hidden bg-[#1b1b1b] p-6 text-[#f7f0e7]">
              <img src={step.image} alt={step.title} className="absolute inset-0 h-full w-full object-cover opacity-60" />
              <div className="relative z-10 flex items-center justify-between">
                <span className="font-sans text-[0.9rem] font-medium tracking-[0.2em] text-[#c38152]">{step.label}</span>
                <span className="text-[2rem] font-light text-[#f7f0e7]/20">0{index + 1}</span>
              </div>
              <div className="relative z-10">
                <h3 className="font-serif text-[clamp(2rem,7vw,3rem)] leading-[1.05] tracking-[-0.02em]">{step.title}</h3>
                <p className="mt-4 font-sans font-light text-[0.9rem] leading-relaxed text-[#f7f0e7]/75">{step.text}</p>
                <button onClick={() => navigate(step.path)} className="mt-6 w-max border-b border-[#f7f0e7]/60 pb-1 font-mono text-[0.62rem] tracking-[0.2em] transition-opacity hover:opacity-60">
                  {step.cta} →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

const REVIEWS = [
  {
    label: "Sayfa 1",
    title: "Çok taze geldi",
    text: "Uzun süredir reklamlarını görüyordum, sonunda sipariş verdim. Bir kaç gün önce kavrulmuş kahve gönderdiler. Harika!",
    cta: "kahve keyfini katla",
  },
  {
    label: "Sayfa 2",
    title: "KAHVEMİ BULDUM",
    text: "Kargoya verildiği gün öğütülmüş. Tadını çok sevdim, artık başka kahve denememe gerek kalmadı.",
    cta: "KENDİ DENEYİMİNİ YAŞA",
  },
  {
    label: "Sayfa 3",
    title: "İÇİMİ ÇOK rahat",
    text: "Uzun zamandır kullandığımız kahveyi değiştirip buradan aldık. Eşim ve ben çok sevdik, içimi çok rahat.",
    cta: "KENDİ DENEYİMİNİ YAŞA",
  },
  {
    label: "Sayfa 4",
    title: "BA-YIL-DIM",
    text: "Artık favorim A Roasting Lab. Çok hızlı gönderdiler hem de tadı inanılmaz.",
    cta: "KENDİ DENEYİMİNİ YAŞA",
  },
  {
    label: "Sayfa 5",
    title: "HERKESE ÖNERİYORUM",
    text: "Genelde çoklu setlerinden alıyorum ve sürekli farklı kahveler içmiş oluyorum. Hepsi çok lezzetli. Bütün arkadaşlarıma öneriyorum.",
    cta: "KENDİ DENEYİMİNİ YAŞA",
  },
];

const REVIEW_VIDEOS = [
  "https://cdn.shopify.com/videos/c/o/v/44fe10bbe5bd407c8d67f6fc89f04862.mp4",
  "https://cdn.shopify.com/videos/c/o/v/c8e3e4f097d94cadbea726b2ba861e44.mp4",
  "https://cdn.shopify.com/videos/c/o/v/49dcfbb679ff4958a9e439e68bd426e8.mp4",
  "https://cdn.shopify.com/videos/c/o/v/bca8e29d7ac2421d94defc070811b3aa.mp4",
  "https://cdn.shopify.com/videos/c/o/v/eb53979c712e478a81536fbb77602f2f.mp4",
];


// ─── INSTAGRAM SECTION ────────────────────────────────────────────────────────
// Behold.so widget ID — behold.so adresinden alınan widget ID'sini buraya girin
const BEHOLD_WIDGET_ID = "2Bq1roFMFrVyL89Ztq1C";

function InstagramSection() {
  const instagramReveal = useReveal();
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = widgetRef.current;
    if (!container) return;

    container.innerHTML = `<behold-widget feed-id="${BEHOLD_WIDGET_ID}"></behold-widget>`;

    const existingScript = document.querySelector('script[src="https://w.behold.so/widget.js"]');
    if (existingScript) {
      existingScript.remove();
    }
    const script = document.createElement("script");
    script.src = "https://w.behold.so/widget.js";
    script.type = "module";
    document.head.appendChild(script);
  }, []);

  return (
    <section className="border-t border-[#1b1b1b]/10 bg-[#f7f0e7] px-5 py-16 md:px-10 md:py-24">
      <div
        ref={instagramReveal.ref}
        className={`mx-auto max-w-[1500px] transition-all duration-1000 ${instagramReveal.visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
      >
        {/* Başlık — diğer section'larla aynı sol hizalı grid yapısı */}
        <div className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="mb-3 font-mono text-[0.75rem] tracking-[0.28em] text-[#C17A3A]">SOSYAL MEDYADA BİZ</p>
            <h2 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[1.1] tracking-[-0.02em] text-[#1b1b1b]">
              Instagram'da bize katıl
            </h2>
          </div>
          <a
            href="https://www.instagram.com/editioncoffeeroastery"
            target="_blank"
            rel="noopener noreferrer"
            className="w-max border-b border-[#1b1b1b] pb-1 font-mono text-[0.62rem] tracking-[0.2em] text-[#1b1b1b] transition-opacity hover:opacity-60"
          >
            @editioncoffeeroastery →
          </a>
        </div>

        {/* Widget — max genişlik kısıtlı ve ortalanmış */}
        <div className="mx-auto max-w-[960px]">
          <div ref={widgetRef} />
        </div>
      </div>
    </section>
  );
}

const heroSlides = [
  { title: "Türk Kahvesi", subtitle: "GELENEKSEL & NİTELİKLİ", image: "https://plus.unsplash.com/premium_photo-1732818135469-3bfc10ed83a2?w=900&auto=format&fit=crop&q=60", link: "/kahveler?kategori=turk-kahvesi" },
  { title: "Filtre Kahve", subtitle: "DEMLEME PROFİLLERİ", image: "https://images.unsplash.com/photo-1638202518327-956c496a5240?w=900&auto=format&fit=crop&q=60", link: "/kahveler?kategori=filtre" },
  { title: "Espresso", subtitle: "YOĞUN & GÖVDELİ", image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=2000&auto=format&fit=crop", link: "/kahveler?kategori=espresso" },
  { title: "Avantajlı Paketler", subtitle: "ÖZEL SEÇKİLER", image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=2000&auto=format&fit=crop", link: "/kahveler?kategori=paket" },
];

export default function Anasayfa() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeProductTab, setActiveProductTab] = useState<string>("ESPRESSO");
  const [quickAddHandle, setQuickAddHandle] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const reviewsStickyRef = useRef<HTMLDivElement>(null);
  const reviewsProgress = useScrollProgress(reviewsStickyRef);
  const activeReviewIndex = Math.min(
    REVIEWS.length - 1,
    Math.max(0, Math.floor(reviewsProgress * REVIEWS.length))
  );

  const featuredReveal = useReveal();
  const tabsReveal = useReveal();
  const storyReveal = useReveal();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsPageLoaded(true);
    fetchShopifyProducts()
      .then(setAllProducts)
      .catch((err) => console.error("Ürünler yüklenemedi:", err))
      .finally(() => setLoading(false));
  }, []);

  const tabProducts = allProducts.filter((p) => {
    const filter =
      activeProductTab === "TÜRK KAHVESİ" ? "turk-kahvesi" :
      activeProductTab === "FİLTRE" ? "filtre" :
      "espresso";
    return p.category.some((t) => t.toLowerCase().includes(filter));
  });

  const featuredProducts = allProducts.slice(0, 4);

  return (
    <div className="-mt-[130px] min-h-screen bg-[#f7f0e7] font-sans text-[#1b1b1b] selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">
      <style>{`
        @keyframes arlMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .arl-marquee { animation: arlMarquee 34s linear infinite; }
        .arl-marquee:hover { animation-play-state: paused; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 1. SLIDESHOW / HERO */}
      <section className="relative min-h-screen overflow-hidden border-b border-[#1b1b1b]/10 bg-[#1b1b1b] text-[#f7f0e7]">
        {heroSlides.map((slide, i) => (
          <img
            key={i}
            src={slide.image}
            alt={slide.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === activeSlide ? 'opacity-80' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1b]/80 via-[#1b1b1b]/25 to-transparent" />

        {/* Mobil: sol/sağ ok butonları */}
        <button
          onClick={() => setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-[#f7f0e7]/30 bg-[#1b1b1b]/20 text-[#f7f0e7] backdrop-blur-sm transition-all hover:bg-[#1b1b1b]/50 md:hidden"
          aria-label="Önceki"
        >
          ‹
        </button>
        <button
          onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-[#f7f0e7]/30 bg-[#1b1b1b]/20 text-[#f7f0e7] backdrop-blur-sm transition-all hover:bg-[#1b1b1b]/50 md:hidden"
          aria-label="Sonraki"
        >
          ›
        </button>

        {/* İçerik: mobilde orta-alt, masaüstünde sol-alt */}
        <div className="relative z-10 flex min-h-screen flex-col">
          <div className={`mx-auto flex w-full max-w-[1500px] flex-1 flex-col items-center justify-end px-5 pb-20 text-center md:items-start md:justify-end md:px-10 md:pb-16 md:text-left lg:px-14 transition-all duration-1000 ${isPageLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <p className="mb-4 font-mono text-[0.62rem] tracking-[0.34em] text-[#f7f0e7]/60 transition-all duration-700">
              {heroSlides[activeSlide].subtitle}
            </p>
            <h1 className="font-serif text-[clamp(2.4rem,5vw,4.8rem)] leading-[1.05] tracking-[-0.02em] transition-all duration-700">
              {heroSlides[activeSlide].title}
            </h1>
            <button
              onClick={() => navigate(heroSlides[activeSlide].link)}
              className="mt-8 border border-[#f7f0e7]/60 px-8 py-4 font-mono text-[0.62rem] tracking-[0.22em] text-[#f7f0e7] transition-all hover:bg-[#f7f0e7] hover:text-[#1b1b1b]"
            >
              KEŞFET
            </button>
          </div>

          {/* Masaüstü: noktalar orta-alt */}
          <div className="hidden md:flex absolute bottom-10 left-1/2 -translate-x-1/2 items-center gap-3">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`transition-all duration-300 rounded-full ${i === activeSlide ? 'w-6 h-1.5 bg-[#f7f0e7]' : 'w-1.5 h-1.5 bg-[#f7f0e7]/40 hover:bg-[#f7f0e7]/70'}`}
              />
            ))}
          </div>

          {/* Mobil: noktalar içerik altında */}
          <div className="flex md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-3">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`transition-all duration-300 rounded-full ${i === activeSlide ? 'w-6 h-1.5 bg-[#f7f0e7]' : 'w-1.5 h-1.5 bg-[#f7f0e7]/40 hover:bg-[#f7f0e7]/70'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. MARQUEE */}
      <div className="overflow-hidden whitespace-nowrap border-b border-[#1b1b1b]/10 bg-white py-4 text-[#1b1b1b]">
        <div className="arl-marquee inline-flex items-center">
          {[...Array(2)].map((_, repeatIndex) => (
            <span key={repeatIndex} className="inline-flex items-center">
              {[
                "2019'DAN BERİ 100,000+ MUTLU KAHVESEVERİN TERCİHİ",
                "SİPARİŞİNİZE ÖZEL TAZE KAVRUM",
                "850 TL VE ÜZERİ SİPARİŞLERDE ÜCRETSİZ KARGO",
                "TÜRK KAHVESİ · FİLTRE · ESPRESSO",
                "AYNI GÜN KARGOYA VERİLİR",
                "100% ARABİCA, TEK KÖKEN VE HARMANLAR",
                "ANKARA'DAN TÜM TÜRKİYE'YE",
              ].map((text, i) => (
                <span key={i} className="inline-flex items-center px-8 font-mono text-[0.72rem] tracking-[0.24em] md:text-[0.82rem]">
                  {text}
                  <span className="ml-8 h-1.5 w-1.5 rounded-full bg-[#C17A3A]" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>


      {/* 4. FEATURED COLLECTION */}
      <section className="border-b border-[#1b1b1b]/10 bg-[#f7f0e7] px-5 py-16 md:px-10 md:py-24">
        <div ref={featuredReveal.ref} className={`mx-auto max-w-[1500px] transition-all duration-1000 ${featuredReveal.visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <div className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mb-3 font-mono text-[0.75rem] tracking-[0.28em] text-[#C17A3A]">HERKESİN BAYILDIĞI</p>
              <h2 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[1.1] tracking-[-0.02em] text-[#1b1b1b]">
                En çok tercih edilenler<br className="hidden md:block" /> 
              </h2>
            </div>
            <button
              onClick={() => navigate("/kahveler")}
              className="w-max border-b border-[#1b1b1b] pb-1 font-mono text-[0.62rem] tracking-[0.2em] text-[#1b1b1b] transition-opacity hover:opacity-60"
            >
              HEPSİNİ GÖR →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 xl:gap-8">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : featuredProducts.map((p) => <ProductCard key={`featured-${p.id}`} p={p} onQuickAdd={(prod) => setQuickAddHandle(prod.handle)} />)}
          </div>
        </div>
      </section>



      {/* 6. KAHVE KATEGORİLERİ */}
      <KahveKategorileriSection />

      {/* 7. TAB COLLECTIONS */}
      <section id="dukkan" className="scroll-mt-20 border-b border-[#1b1b1b]/10 bg-[#f7f0e7] px-5 py-16 md:px-10 md:py-24">
        <div ref={tabsReveal.ref} className={`mx-auto max-w-[1500px] transition-all duration-1000 ${tabsReveal.visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          {/* Başlık */}
          <div className="mb-8">
            <p className="mb-3 font-mono text-[0.75rem] tracking-[0.28em] text-[#C17A3A]">HANGİ PAKETİ İSTERSEN!</p>
            <h2 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[1.1] tracking-[-0.02em] text-[#1b1b1b]">
              Demleme yöntemine uygun kahveyi seç.
            </h2>
          </div>

          {/* Kategori butonları — ortalanmış */}
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {PRODUCT_CATEGORY_LABELS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveProductTab(tab)}
                className={`border px-5 py-3 font-mono text-[0.6rem] tracking-[0.18em] transition-all ${
                  activeProductTab === tab
                    ? "border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7]"
                    : "border-[#1b1b1b]/20 bg-transparent text-[#1b1b1b] hover:border-[#1b1b1b]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Yatay scroll — hem masaüstü hem mobil */}
          <div className="relative">
            <div
              id="tab-scroll"
              className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
            >
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-[62vw] md:w-[22%] shrink-0 snap-start"><SkeletonCard /></div>
                  ))
                : tabProducts.length > 0
                  ? tabProducts.map((p) => (
                      <div key={`tab-${p.id}`} className="w-[62vw] md:w-[22%] shrink-0 snap-start">
                        <ProductCard p={p} onQuickAdd={(prod) => setQuickAddHandle(prod.handle)} />
                      </div>
                    ))
                  : <div className="flex w-full items-center justify-center py-16 font-mono text-[0.72rem] tracking-[0.22em] text-[#7f756b]">BU KATEGORİDE ÜRÜN BULUNAMADI.</div>
              }
            </div>
            <button
              onClick={() => document.getElementById('tab-scroll')?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="absolute -left-3 top-[40%] -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-[#fdfaf6] border border-[#1b1b1b]/15 shadow-sm text-[#1b1b1b] text-lg z-10"
            >‹</button>
            <button
              onClick={() => document.getElementById('tab-scroll')?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="absolute -right-3 top-[40%] -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-[#fdfaf6] border border-[#1b1b1b]/15 shadow-sm text-[#1b1b1b] text-lg z-10"
            >›</button>
          </div>

          <button onClick={() => navigate("/kahveler")} className="mt-8 border-b border-[#1b1b1b] pb-1 font-mono text-[0.62rem] tracking-[0.2em] hover:opacity-60">
            HEPSİNİ GÖR →
          </button>
        </div>
      </section>

      {/* 9. ICONS ROW */}
      <section className="border-b border-[#1b1b1b] bg-[#1b1b1b] py-14 text-[#f7f0e7] md:py-18">
        {/* Masaüstü */}
        <div className="mx-auto hidden max-w-[1500px] md:grid grid-cols-4 divide-x divide-[#f7f0e7]/14 px-10">
          {FEATURE_ITEMS.map((feat) => (
            <div key={feat.title} className="px-4 py-0 text-center">
              <h4 className="font-serif text-[clamp(1.2rem,1.8vw,1.8rem)] leading-none tracking-[-0.02em] text-[#c38152]">{feat.title}</h4>
              <p className="mt-3 font-mono text-[0.75rem] tracking-[0.2em] text-[#f7f0e7]/60">{feat.subtitle}</p>
            </div>
          ))}
        </div>
        {/* Mobil: dikey liste */}
        <div className="flex flex-col divide-y divide-[#f7f0e7]/14 px-5 md:hidden">
          {FEATURE_ITEMS.map((feat) => (
            <div key={feat.title} className="flex items-center justify-between py-5">
              <h4 className="font-serif text-[1.3rem] leading-none tracking-[-0.02em] text-[#c38152]">{feat.title}</h4>
              <p className="font-mono text-[0.75rem] tracking-[0.2em] text-[#f7f0e7]/60">{feat.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

     
      {/* SOSYAL MEDYADA BİZ */}
      <InstagramSection />

      {/* 12. IMAGE WITH TEXT */}
      <section className="bg-[#1b1b1b] text-[#f7f0e7]">
        <div ref={storyReveal.ref} className={`mx-auto grid max-w-[1600px] grid-cols-1 transition-all duration-1000 lg:grid-cols-2 ${storyReveal.visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <div className="min-h-[520px] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2000&auto=format&fit=crop" alt="Edition Coffee Roastery" className="h-full min-h-[520px] w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-10 lg:p-16">
            <p className="mb-4 font-mono text-[0.75rem] tracking-[0.28em] text-[#c38152]">EDITION COFFEE ROASTERY</p>
            <h2 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[1.1] tracking-[-0.02em]">Kahve Felsefemiz</h2>
            <div className="mt-8 max-w-[650px] space-y-5 text-[1rem] font-light leading-relaxed text-[#f7f0e7]/74">
              <p>2023 yılında Ankara’da, kahve deneyimini en üst noktaya taşımak vizyonuyla yola çıktık. Bize göre kahve; sıradan bir alışkanlık değil, her aşamasında titizlik ve ustalık gerektiren bir zanaattır.</p>
              <p>Biz, kalitenin tesadüflere veya yoruma bırakılamayacağına inanıyoruz. Bu yüzden standartların ötesine geçiyor; yalnızca dünyanın dört bir yanından özenle seçilmiş, en yüksek tadım puanlarına sahip nadide çekirdekleri kavurucumuza alıyoruz.</p>
              <p>Amacımız net: Karakteristiği korunmuş, her zaman taze ve kusursuz lezzete sahip o eşsiz fincanı sana sunmak. Çünkü Edition Coffee’de kahve, yalnızca içtiğin bir içecek değil, kaliteye olan saygımızın bir yansımasıdır.</p>
            </div>
            <button onClick={() => navigate("/kahveler")} className="mt-9 w-max border-b border-[#f7f0e7]/50 pb-1 font-mono text-[0.62rem] tracking-[0.2em] text-[#f7f0e7] transition-opacity hover:opacity-60">
              FAVORİ KAHVENİ BUL →
            </button>
          </div>
        </div>
      </section>

      {/* 8. REVIEWS — geçici olarak gizlendi */}

      {quickAddHandle && (
        <QuickAddModal
          handle={quickAddHandle}
          onClose={() => setQuickAddHandle(null)}
        />
      )}
    </div>
  );
}
