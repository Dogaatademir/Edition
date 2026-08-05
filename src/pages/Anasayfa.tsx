// src/pages/Anasayfa.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { fetchShopifyProducts, type CoffeeProduct } from "../lib/shopify";
import QuickAddModal from "../components/QuickAddModal";
import { useSeo } from "../hooks/useSeo";

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
              className={`h-full w-full scale-150 object-contain transition-all duration-500 ease-out group-hover:scale-[1.55] ${secondImage ? (hovered ? 'opacity-0' : 'opacity-100') : ''}`}
              loading="lazy"
            />
            {secondImage && (
              <img
                src={secondImage}
                alt={p.name}
                className={`absolute inset-0 h-full w-full scale-150 object-contain transition-all duration-500 ease-out group-hover:scale-[1.55] ${hovered ? 'opacity-100' : 'opacity-0'}`}
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
  { title: "SİPARİŞE ÖZEL", subtitle: "TAZE KAVRULMUŞ" },
  { title: "TEK KÖKEN", subtitle: "%100 ARABİCA ÇEKİRDEKLERİ" },
  { title: "SPECIALTY COFFEE", subtitle: "80+ PUAN ÇEKİRDEK" },
  { title: "2023'TEN BERİ", subtitle: "100.000+ MUTLU FİNCAN" },
];

const KAHVE_KATEGORILERI = [
  {
    label: "TÜRK KAHVESİ",
    title: "Gelenekten Gelen Derinlik",
    text: "Yüzyıllık geleneği modern kavurma anlayışıyla buluşturuyoruz. Her fincan, doğru sıcaklıkta, köpüklü ve karakterli.",
    cta: "KEŞFEDİN",
    path: "/kahveler/turk-kahvesi",
    image: "https://plus.unsplash.com/premium_photo-1732818135469-3bfc10ed83a2?w=900&auto=format&fit=crop&q=60",
  },
  {
    label: "FİLTRE KAHVE",
    title: "Sabahın En Saf Hali",
    text: "Tek köken çekirdekler, hassas demleme profilleri. V60'tan Chemex'e her yöntem için siparişe özel öğütülür.",
    cta: "DEMLEMEYİ SEÇ",
    path: "/kahveler/filtre-kahve",
    image: "https://images.unsplash.com/photo-1638202518327-956c496a5240?w=900&auto=format&fit=crop&q=60",
  },
  {
    label: "ESPRESSO",
    title: "Yoğun, Gövdeli, Unutulmaz",
    text: "Özenle seçilmiş harmanlar, yüksek basınçta sıkıştırılmış lezzet. Evinizdeki espresso deneyimini bir üst seviyeye taşıyın.",
    cta: "HARMANI İNCELE",
    path: "/kahveler/espresso",
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
  { title: "Üyelere Özel\n%5 İndirim", subtitle: "Dünya Kahvelerini Keşfetmeniz İçin", image: "/BANNER/W7.jpg", link: "/kahveler" },
  { title: "Tüm Ürünlerde\n%20'ye Varan İndirim", subtitle: "Eşsiz Lezzetleri Keşfedin", image: "/BANNER/s1.jpg", link: "/kahveler" },
  { title: "2. Ürüne %15\n3. Ürüne %20 İndirim", subtitle: "Farklı Lezzetler Denemeniz İçin", image: "/BANNER/W19.jpg", link: "/kahveler" },
  { title: "3500 TL ve Üzeri Siparişlerde\n%15 İndirim", subtitle: "Kafe ve İşletmelere Özel", image: "/BANNER/W11.jpg", link: "/kahveler" },
];

export default function Anasayfa() {
  useCart();
  useSeo(
    'Edition Coffee Roastery',
    'Edition Coffee Roastery — taze kavrulmuş Türk kahvesi, filtre kahve ve espresso. Yüzyıllık geleneği modern kavurmayla buluşturuyoruz. 850 TL üzeri kargo ücretsiz.',
    '/'
  );
  const navigate = useNavigate();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeProductTab, setActiveProductTab] = useState<string>("ESPRESSO");
  const [quickAddHandle, setQuickAddHandle] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading] = useState(true);


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

  const featuredHandles = [
    "dunya-filtre-kahveleri-tanisma",
    "hisaralti®-turk-kahvesi-seti",
    "edition-ozel-filtre-harman",
    "ultragold-espresso-ozel-harman",
  ];
  const featuredProducts = featuredHandles
    .map((handle) => allProducts.find((p) => p.handle === handle))
    .filter((p): p is CoffeeProduct => Boolean(p));

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
            <p className="mb-4 font-serif text-[clamp(0.8rem,1.6vw,1.35rem)] tracking-[0.08em] text-[#f7f0e7] transition-all duration-700">
              {heroSlides[activeSlide].subtitle}
            </p>
            <h1 className="whitespace-pre-line font-serif text-[clamp(1.9rem,3.8vw,3.6rem)] leading-[1.05] tracking-[-0.02em] transition-all duration-700">
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
                "2023'DAN BERİ 100,000+ MUTLU KAHVESEVERİN TERCİHİ",
                "SİPARİŞİNİZE ÖZEL TAZE KAVRULMUŞ",
                "850 TL VE ÜZERİ SİPARİŞLERDE ÜCRETSİZ KARGO",
                "TÜRK KAHVESİ · FİLTRE KAHVE · ESPRESSO",
                "AYNI GÜN KARGOYA VERİLİR",
                "100% ARABİCA, TEK KÖKEN VE HARMANLAR",
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
